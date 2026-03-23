'use client'

import { useState, useEffect, useCallback, ReactNode } from 'react'

const STORAGE_KEY = 'battlechain-docs-network'
const EVENT_NAME = 'battlechain-network-change'
const LABELS = ['Testnet', 'Mainnet'] as const

function useNetwork() {
  const [active, setActive] = useState('Testnet')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && LABELS.includes(stored as typeof LABELS[number])) {
      setActive(stored)
    }

    function onNetworkChange(e: Event) {
      const network = (e as CustomEvent<string>).detail
      setActive(network)
    }

    window.addEventListener(EVENT_NAME, onNetworkChange)
    return () => window.removeEventListener(EVENT_NAME, onNetworkChange)
  }, [])

  const select = useCallback((label: string) => {
    setActive(label)
    localStorage.setItem(STORAGE_KEY, label)
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, { detail: label }),
    )
  }, [])

  return { active, select }
}

export function NetworkToggle() {
  const { active, select } = useNetwork()

  return (
    <div className="inline-flex gap-0.5 p-0.5 border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {LABELS.map((label) => (
        <button
          key={label}
          onClick={() => select(label)}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors rounded-md ${
            active === label
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
  const { active } = useNetwork()
  if (active !== title) return null
  return <div>{children}</div>
}
