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
  disabled?: string
  children: ReactNode
}

export function Tabs({ labels, disabled, children }: TabsProps) {
  const tabLabels = labels.split(',').map((l) => l.trim())
  const disabledLabels = disabled ? disabled.split(',').map((l) => l.trim()) : []
  const enabledLabels = tabLabels.filter((l) => !disabledLabels.includes(l))
  const [active, setActive] = useState(enabledLabels[0] || tabLabels[0])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get(URL_PARAM)
    if (fromUrl && enabledLabels.includes(fromUrl)) {
      setActive(fromUrl)
      localStorage.setItem(STORAGE_KEY, fromUrl)
      return
    }
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && enabledLabels.includes(stored)) {
      setActive(stored)
    }
  }, [labels, disabled])

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
          {tabLabels.map((label) => {
            const isDisabled = disabledLabels.includes(label)
            return (
              <button
                key={label}
                onClick={() => !isDisabled && handleSelect(label)}
                disabled={isDisabled}
                className={`px-5 py-2.5 rounded-lg text-base font-semibold transition-colors border inline-flex items-center gap-2 ${
                  isDisabled
                    ? 'text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-60'
                    : active === label
                      ? 'bg-[var(--product-primary)] text-white dark:text-gray-900 border-[var(--product-primary)]'
                      : 'text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {label}
                {isDisabled && (
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    Soon
                  </span>
                )}
              </button>
            )
          })}
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
