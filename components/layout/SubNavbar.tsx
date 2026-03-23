'use client'

import { useState, useEffect, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { createPortal } from 'react-dom'
import { NetworkToggle } from '@/components/mdx/NetworkTabs'

const PORTAL_ID = 'sub-navbar-actions'

export function SubNavbar() {
  const pathname = usePathname()
  const isOverview = pathname === '/' || pathname === '/overview'

  if (isOverview) return null

  return (
    <nav className="sticky top-14 md:top-16 z-30 w-full bg-gray-50 dark:bg-[#0E1119] border-b border-gray-200 dark:border-[#333741]">
      <div className="flex items-center justify-between px-4 py-1.5 mx-auto">
        <NetworkToggle />
        <div id={PORTAL_ID} className="flex items-center gap-2" />
      </div>
    </nav>
  )
}

export function SubNavbarActions({ children }: { children: ReactNode }) {
  const [container, setContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setContainer(document.getElementById(PORTAL_ID))
  }, [])

  if (!container) return null
  return createPortal(children, container)
}
