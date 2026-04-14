'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'

const STORAGE_KEY = 'battlechain-docs-path'
const URL_PARAM = 'path'
const TabContext = createContext<string>('')

interface TabsProps {
  labels: string
  children: ReactNode
}

export function Tabs({ labels, children }: TabsProps) {
  const tabLabels = labels.split(',').map((l) => l.trim())
  const [active, setActive] = useState(tabLabels[0])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get(URL_PARAM)
    if (fromUrl && tabLabels.includes(fromUrl)) {
      setActive(fromUrl)
      localStorage.setItem(STORAGE_KEY, fromUrl)
      return
    }
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && tabLabels.includes(stored)) {
      setActive(stored)
    }
  }, [labels])

  const handleSelect = useCallback(
    (label: string) => {
      setActive(label)
      localStorage.setItem(STORAGE_KEY, label)
      const url = new URL(window.location.href)
      url.searchParams.set(URL_PARAM, label)
      window.history.replaceState({}, '', url.toString())
    },
    [],
  )

  return (
    <TabContext.Provider value={active}>
      <div className="not-prose sticky top-16 z-20 -mx-4 px-4 py-4 mb-8 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Choose your path</p>
        <div className="flex gap-2">
          {tabLabels.map((label) => (
            <button
              key={label}
              onClick={() => handleSelect(label)}
              className={`px-5 py-2.5 rounded-lg text-base font-semibold transition-colors border ${
                active === label
                  ? 'bg-[var(--product-primary)] text-white dark:text-gray-900 border-[var(--product-primary)]'
                  : 'text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {children}
    </TabContext.Provider>
  )
}

interface TabProps {
  title: string
  children: ReactNode
}

export function Tab({ title, children }: TabProps) {
  const active = useContext(TabContext)
  if (active !== title) return null
  return <div className="tab-content">{children}</div>
}
