'use client'

import { useState, useEffect, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { createPortal } from 'react-dom'
import { NetworkToggle } from '@/components/mdx/NetworkTabs'
import networkAwarePages from '@/config/network-aware-pages.json'

const PORTAL_ID = 'sub-navbar-actions'

export function SubNavbar() {
  const pathname = usePathname()

  // Landing pages have no page actions or toggle.
  if (pathname === '/' || pathname === '/overview') return null

  // The Mainnet/Testnet toggle appears only on pages that actually respond to
  // it — those declared `networkAware: true` in frontmatter (collected at build
  // time into config/network-aware-pages.json). Elsewhere the bar still renders
  // for the page actions, but the toggle would be an inert no-op, so it's hidden.
  const showToggle = (networkAwarePages as string[]).includes(pathname)

  return (
    <nav className="sticky top-14 md:top-16 z-30 w-full bg-gray-50 dark:bg-[#0E1119] border-b border-gray-200 dark:border-[#333741]">
      <div className="flex items-center justify-between px-4 py-1.5 mx-auto">
        {showToggle ? <NetworkToggle /> : <span />}
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
