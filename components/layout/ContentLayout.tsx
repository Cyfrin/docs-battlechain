'use client'

import { usePathname } from 'next/navigation'
import { TableOfContents } from './TableOfContents'
import { ReactNode } from 'react'

export function ContentLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isOverview = pathname === '/' || pathname === '/overview'

  return (
    <div className="mx-auto px-4 py-8 max-w-7xl flex gap-8">
      <div className={`flex-1 ${isOverview ? 'max-w-none px-8' : 'max-w-4xl'}`}>
        {children}
      </div>
      {!isOverview && <TableOfContents />}
    </div>
  )
}
