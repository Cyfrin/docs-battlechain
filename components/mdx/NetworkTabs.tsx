'use client'

import {
  createContext,
  useCallback,
  useContext,
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

// The pre-paint inline script in app/layout.tsx has already resolved the
// network (URL > localStorage > cookie > default) and written it to
// <html data-network="...">. Initialize from that so the first client render
// matches what's on screen — no flash, no localStorage useEffect race.
function readInitialNetwork(): NetworkId {
  if (typeof document === 'undefined') return DEFAULT_NETWORK
  return normalize(document.documentElement.dataset.network ?? null) ?? DEFAULT_NETWORK
}

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [network, setNetworkState] = useState<NetworkId>(readInitialNetwork)

  const setNetwork = useCallback((next: NetworkId) => {
    setNetworkState(next)
    if (typeof document !== 'undefined') {
      // Keep all three signals in sync so the next page load (and the inline
      // script) sees the choice, and CSS-driven blocks update immediately.
      document.documentElement.dataset.network = next
      localStorage.setItem(STORAGE_KEY, next)
      document.cookie = `${STORAGE_KEY}=${next};path=/;max-age=31536000;samesite=lax`
    }
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
  // Render BOTH networks' blocks into the HTML and hide the inactive one via CSS
  // keyed on <html data-network> (see globals.css). This keeps SSR and client
  // markup identical (no hydration mismatch) and the pre-paint script hides the
  // wrong block before first paint (no flash). Use this only where the prose
  // genuinely differs — value-only differences should use <NetworkValue> or
  // {{tokens}} in code fences instead.
  const block = title.toLowerCase()
  return <div data-network-block={block}>{children}</div>
}

interface TestnetOnlyProps {
  // The kind of content being gated, used in the banner: "This {noun} can only
  // be run on Testnet". Defaults to "walkthrough". Use e.g. "demo", "tutorial".
  noun?: string
  // Optional activity clause appended in parentheses, e.g. "deploy and attack a vault".
  activity?: string
  children: ReactNode
}

// Wrap a quickstart (or any flow only possible on testnet). On testnet the
// children render normally; on mainnet they're hidden and a banner prompts the
// reader to switch networks. Uses the same data-network-block CSS as <Network>,
// so the right view is correct on first paint with no flash.
export function TestnetOnly({ noun = 'walkthrough', activity, children }: TestnetOnlyProps) {
  const { setNetwork } = useNetwork()
  return (
    <>
      <div data-network-block="mainnet" className="not-prose my-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
        <p className="m-0 text-sm">
          This {noun}{activity ? ` (${activity})` : ''} can only be run on{' '}
          <strong>Testnet</strong> — it isn&apos;t possible on mainnet. Switch
          to the testnet to follow along.
        </p>
        <button
          onClick={() => setNetwork('testnet')}
          className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer"
        >
          Switch to Testnet
        </button>
      </div>
      <div data-network-block="testnet">{children}</div>
    </>
  )
}
