'use client'

import { battlechain } from '@/config/battlechain'

interface NetworkInfoProps {
  network?: 'testnet' | 'mainnet'
}

export function NetworkInfo({ network = 'testnet' }: NetworkInfoProps) {
  const config = battlechain[network]

  const addToMetaMask = async () => {
    const ethereum = typeof window !== 'undefined' ? (window as any).ethereum : null
    if (!ethereum) {
      window.open('https://metamask.io/download/', '_blank')
      return
    }
    try {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${Number(config.chainId).toString(16)}`,
            chainName: config.name,
            rpcUrls: [config.rpcUrl],
            blockExplorerUrls: [config.explorer],
            nativeCurrency: {
              name: 'Ether',
              symbol: config.currencySymbol,
              decimals: 18,
            },
          },
        ],
      })
    } catch (error: any) {
      if (error?.code === 4001) {
        // User rejected the request
      } else {
        alert(`Failed to add network: ${error?.message || 'Unknown error'}`)
      }
    }
  }

  return (
    <div className="not-prose my-6 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold m-0">{config.name}</h3>
        {typeof config.chainId === 'number' && (
          <button
            onClick={addToMetaMask}
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-orange-500 text-white hover:bg-orange-600 transition-colors cursor-pointer"
          >
            Add to MetaMask
          </button>
        )}
      </div>
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
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">Explorer</td>
              <td className="py-2">
                {config.explorer !== 'TBD' ? (
                  <a href={config.explorer} target="_blank" rel="noopener noreferrer" className="text-[#004DFF] hover:underline font-mono break-all">
                    {config.explorer}
                  </a>
                ) : (
                  <span className="font-mono">TBD</span>
                )}
              </td>
            </tr>
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
