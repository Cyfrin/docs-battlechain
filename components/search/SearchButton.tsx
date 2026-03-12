'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { SearchModal } from './SearchModal'
import type { SearchDocument } from '@/lib/search'

export function SearchButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchIndex, setSearchIndex] = useState<SearchDocument[]>([])

  // Load pre-built search index
  useEffect(() => {
    fetch('/search-index.json')
      .then((res) => res.json())
      .then((data) => setSearchIndex(data))
      .catch((error) => console.error('Failed to load search index:', error))
  }, [])

  // Handle Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 bg-gray-100 border border-gray-200 hover:bg-gray-200 rounded-lg transition-colors dark:text-gray-300 dark:bg-[#161B26] dark:border-[#333741] dark:hover:bg-[#1D2432]"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium text-gray-500 bg-white rounded border border-gray-300 dark:text-gray-400 dark:bg-[#0E1119] dark:border-[#333741]">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <SearchModal isOpen={isOpen} onClose={() => setIsOpen(false)} searchIndex={searchIndex} />
    </>
  )
}
