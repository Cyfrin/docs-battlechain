'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'

const STORAGE_KEY = 'battlechain-docs-network'

export type NetworkId = 'testnet' | 'mainnet'

const DEFAULT_NETWORK: NetworkId = 'mainnet'

const TOGGLE_OPTIONS: { id: NetworkId; label: string }[] = [
  { id: 'mainnet', label: 'Mainnet' },
  { id: 'testnet', label: 'Testnet' },
]

interface NetworkContextValue {
  network: NetworkId
  setNetwork: (network: NetworkId) => void
}

const NetworkContext = createContext<NetworkContextValue | undefined>(undefined)

function normalize(value: string | null): NetworkId | null {
  const lower = value?.toLowerCase()
  return lower === 'testnet' || lower === 'mainnet' ? lower : null
}

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [network, setNetworkState] = useState<NetworkId>(DEFAULT_NETWORK)

  useEffect(() => {
    // The pre-paint script in app/layout.tsx already resolved the network
    // (URL > localStorage > cookie > default) into <html data-network>. Adopt
    // it so React state matches what CSS has already painted. Initial state
    // stays DEFAULT_NETWORK on both SSR and first client render, so there's no
    // hydration mismatch; CSS-driven <Network> blocks are correct before paint.
    const resolved = normalize(document.documentElement.dataset.network ?? null)
    if (resolved) setNetworkState(resolved)
  }, [])

  const setNetwork = useCallback((next: NetworkId) => {
    setNetworkState(next)
    // Keep all signals in sync so the next load (and the pre-paint script) sees
    // the choice and the CSS-driven blocks update immediately.
    document.documentElement.dataset.network = next
    localStorage.setItem(STORAGE_KEY, next)
    document.cookie = `${STORAGE_KEY}=${next};path=/;max-age=31536000;samesite=lax`
  }, [])

  return (
    <NetworkContext.Provider value={{ network, setNetwork }}>
      {children}
    </NetworkContext.Provider>
  )
}

export function useNetwork(): NetworkContextValue {
  const context = useContext(NetworkContext)
  if (context === undefined) {
    // Return a stable default when rendered outside a provider (e.g. SSR).
    return { network: DEFAULT_NETWORK, setNetwork: () => {} }
  }
  return context
}

export function NetworkToggle() {
  const { network, setNetwork } = useNetwork()

  return (
    <div className="inline-flex gap-0.5 p-0.5 border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {TOGGLE_OPTIONS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => setNetwork(id)}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors rounded-md ${
            network === id
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

interface NetworkProps {
  title: string
  children: ReactNode
}

export function Network({ title, children }: NetworkProps) {
  // Render both networks' blocks and let CSS (keyed on <html data-network>, set
  // before first paint by the script in app/layout.tsx) hide the inactive one.
  // This keeps SSR and client markup identical (no hydration mismatch) and
  // avoids a flash on these statically-generated pages, where the selected
  // network is only known client-side. TableOfContents skips the hidden block's
  // headings so the on-page TOC isn't doubled.
  return <div data-network-block={title.toLowerCase()}>{children}</div>
}
