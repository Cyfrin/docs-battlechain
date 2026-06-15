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
    const stored = normalize(localStorage.getItem(STORAGE_KEY))
    if (stored) setNetworkState(stored)
  }, [])

  const setNetwork = useCallback((next: NetworkId) => {
    setNetworkState(next)
    localStorage.setItem(STORAGE_KEY, next)
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
  const { network } = useNetwork()
  if (title.toLowerCase() !== network) return null
  return <div>{children}</div>
}
