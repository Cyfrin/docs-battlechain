'use client'

import { useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function MobileLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <Header onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  )
}
