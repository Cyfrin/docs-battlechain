'use client'

import { useEffect, useRef, useState } from 'react'
import { battlechain } from '@/config/battlechain'

interface NetworkInfoProps {
  network?: 'testnet' | 'mainnet'
}

interface EIP1193Provider {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>
}

interface EIP6963ProviderInfo {
  uuid: string
  name: string
  icon: string
  rdns: string
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo
  provider: EIP1193Provider
}

interface EIP6963AnnounceProviderEvent extends Event {
  detail: EIP6963ProviderDetail
}

const METAMASK_RDNS = 'io.metamask'

type Status =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }

function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function metaMaskMobileDeeplink(): string {
  if (typeof window === 'undefined') return 'https://metamask.io/download/'
  const { host, pathname, search } = window.location
  return `https://metamask.app.link/dapp/${host}${pathname}${search}`
}

export function NetworkInfo({ network = 'testnet' }: NetworkInfoProps) {
  const config = battlechain[network]
  const providersRef = useRef<EIP6963ProviderDetail[]>([])
  const [mounted, setMounted] = useState(false)
  const [hasInjectedProvider, setHasInjectedProvider] = useState(false)
  const [hasMetaMask, setHasMetaMask] = useState(false)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  useEffect(() => {
    setMounted(true)
    if (typeof window === 'undefined') return

    if ((window as { ethereum?: unknown }).ethereum) setHasInjectedProvider(true)

    const onAnnounce = (event: Event) => {
      const detail = (event as EIP6963AnnounceProviderEvent).detail
      // Deduplicate by uuid (announcements can fire multiple times)
      if (providersRef.current.some((p) => p.info.uuid === detail.info.uuid)) return
      providersRef.current.push(detail)
      setHasInjectedProvider(true)
      if (detail.info.rdns === METAMASK_RDNS) setHasMetaMask(true)
    }

    window.addEventListener('eip6963:announceProvider', onAnnounce)
    window.dispatchEvent(new Event('eip6963:requestProvider'))

    return () => window.removeEventListener('eip6963:announceProvider', onAnnounce)
  }, [])

  const pickMetaMaskProvider = (): EIP1193Provider | null => {
    const eip6963 = providersRef.current.find((p) => p.info.rdns === METAMASK_RDNS)
    if (eip6963) return eip6963.provider

    const legacy = (window as unknown as { ethereum?: EIP1193Provider & { isMetaMask?: boolean; providers?: (EIP1193Provider & { isMetaMask?: boolean })[] } }).ethereum
    if (!legacy) return null

    // Some multi-wallet setups expose `providers` with the individual injections
    if (Array.isArray(legacy.providers)) {
      const mm = legacy.providers.find((p) => p.isMetaMask)
      if (mm) return mm
    }

    if (legacy.isMetaMask) return legacy
    return null
  }

  const addToMetaMask = async () => {
    if (typeof window === 'undefined' || typeof config.chainId !== 'number') return

    const provider = pickMetaMaskProvider()

    if (!provider) {
      if (isMobile()) {
        window.open(metaMaskMobileDeeplink(), '_blank')
      } else {
        window.open('https://metamask.io/download/', '_blank')
      }
      return
    }

    const chainIdHex = `0x${Number(config.chainId).toString(16)}`
    setStatus({ kind: 'pending' })

    try {
      // Try switching first — succeeds visibly if the chain is already added.
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      })
      setStatus({ kind: 'success', message: `Switched to ${config.name}` })
      return
    } catch (error: unknown) {
      const code = (error as { code?: number })?.code
      // 4902 = chain not added; fall through to add it.
      // 4001 = user rejected the switch; bail.
      if (code === 4001) {
        setStatus({ kind: 'idle' })
        return
      }
      if (code !== 4902 && code !== -32603) {
        // Some wallets return -32603 instead of 4902 when the chain is unknown.
        const message = (error as { message?: string })?.message
        if (!message?.toLowerCase().includes('unrecognized')) {
          setStatus({ kind: 'error', message: message ?? 'Failed to switch network' })
          return
        }
      }
    }

    try {
      const hasExplorer = config.explorer !== 'TBD'
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: chainIdHex,
            chainName: config.name,
            rpcUrls: [config.rpcUrl],
            ...(hasExplorer ? { blockExplorerUrls: [config.explorer] } : {}),
            nativeCurrency: {
              name: 'Ether',
              symbol: config.currencySymbol,
              decimals: 18,
            },
          },
        ],
      })
      setStatus({ kind: 'success', message: `${config.name} added to MetaMask` })
    } catch (error: unknown) {
      const code = (error as { code?: number })?.code
      if (code === 4001) {
        setStatus({ kind: 'idle' })
        return
      }
      const message = (error as { message?: string })?.message ?? 'Failed to add network'
      setStatus({ kind: 'error', message })
    }
  }

  // During SSR and the first client render, render a stable label so React
  // hydration matches. After mount we know whether a provider is present and
  // can switch to "Open in MetaMask" / "Install MetaMask" if needed.
  let buttonLabel = 'Add to MetaMask'
  if (mounted) {
    if (status.kind === 'pending') {
      buttonLabel = 'Adding…'
    } else if (hasMetaMask || hasInjectedProvider) {
      buttonLabel = 'Add to MetaMask'
    } else if (isMobile()) {
      buttonLabel = 'Open in MetaMask'
    } else {
      buttonLabel = 'Install MetaMask'
    }
  }

  return (
    <div className="not-prose my-6 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold m-0">{config.name}</h3>
        {typeof config.chainId === 'number' && (
          <button
            onClick={addToMetaMask}
            disabled={status.kind === 'pending'}
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-orange-500 text-white hover:bg-orange-600 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {buttonLabel}
          </button>
        )}
      </div>
      {(status.kind === 'success' || status.kind === 'error') && (
        <div
          className={`px-4 py-2 text-sm border-b border-gray-200 dark:border-gray-700 ${
            status.kind === 'success'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
          }`}
        >
          {status.message}
        </div>
      )}
      <div className="p-4">
        <table className="w-full text-sm m-0">
          <tbody>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-2 pr-4 font-medium text-gray-500 dark:text-gray-400 w-40">Network Name</td>
              <td className="py-2 font-mono">{config.name}</td>
            </tr>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">Chain ID</td>
              <td className="py-2 font-mono">{config.chainId}</td>
            </tr>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">RPC URL</td>
              <td className="py-2 font-mono break-all">{config.rpcUrl}</td>
            </tr>
            {config.explorer !== 'TBD' && (
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">Explorer</td>
                <td className="py-2">
                  <a href={config.explorer} target="_blank" rel="noopener noreferrer" className="text-[#004DFF] hover:underline font-mono break-all">
                    {config.explorer}
                  </a>
                </td>
              </tr>
            )}
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">Currency</td>
              <td className="py-2 font-mono">{config.currencySymbol}</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">CAIP-2 ID</td>
              <td className="py-2 font-mono">{config.caip2}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
