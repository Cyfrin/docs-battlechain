'use client'

import { usePathname } from 'next/navigation'
import { TableOfContents } from './TableOfContents'
import { ReactNode } from 'react'

export function ContentLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isOverview = pathname === '/' || pathname === '/overview'

  return (
    <div className="mx-auto px-3 sm:px-4 py-6 md:py-8 max-w-7xl flex gap-4 md:gap-8">
      <div className={`flex-1 min-w-0 ${isOverview ? 'max-w-none px-2 sm:px-4 md:px-8' : 'max-w-4xl'}`}>
        {children}
      </div>
      {!isOverview && <TableOfContents />}
    </div>
  )
}
