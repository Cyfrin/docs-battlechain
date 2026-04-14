'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, FileText } from 'lucide-react'
import FlexSearch from 'flexsearch'
import type { SearchDocument } from '@/lib/search'
import { AIChatPanel } from './AIChatPanel'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  searchIndex: SearchDocument[]
}

export function SearchModal({ isOpen, onClose, searchIndex }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchDocument[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const indexRef = useRef<FlexSearch.Document<SearchDocument> | null>(null)

  // Initialize FlexSearch index
  useEffect(() => {
    if (!indexRef.current && searchIndex.length > 0) {
      const index = new FlexSearch.Document<SearchDocument>({
        tokenize: 'forward',
        cache: 100,
        document: {
          id: 'id',
          index: ['title', 'content', 'headings'],
          store: ['id', 'title', 'content', 'url', 'category', 'headings'],
        },
        context: {
          resolution: 9,
          depth: 3,
          bidirectional: true,
        },
      })

      searchIndex.forEach((doc) => {
        index.add(doc)
      })

      indexRef.current = index
    }
  }, [searchIndex])

  // Perform search
  useEffect(() => {
    if (!query.trim() || !indexRef.current) {
      setResults([])
      setSelectedIndex(0)
      return
    }

    const searchResults = indexRef.current.search(query, 10)
    const uniqueResults: SearchDocument[] = []
    const seenIds = new Set<string>()

    for (const result of searchResults) {
      if (Array.isArray(result.result)) {
        for (const id of result.result) {
          if (!seenIds.has(id as string)) {
            seenIds.add(id as string)
            const doc = searchIndex.find((d) => d.id === id)
            if (doc) {
              uniqueResults.push(doc)
            }
          }
        }
      }
    }

    setResults(uniqueResults.slice(0, 10))
    setSelectedIndex(0)
  }, [query, searchIndex])

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return

      // Don't handle keyboard events if user is typing in AI chat
      const target = e.target as HTMLElement
      if (target.closest('.ai-chat-panel')) {
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % results.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            handleResultClick(results[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    },
    [isOpen, results, selectedIndex, onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Close on backdrop click
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  const handleResultClick = (result: SearchDocument) => {
    router.push(result.url)
    onClose()
  }

  const highlightMatch = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-[var(--product-primary)]/30 text-[var(--product-primary)] dark:text-[var(--product-light)] font-semibold rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] md:pt-[10vh] px-2 md:px-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        ref={modalRef}
        className="relative w-full max-w-2xl md:max-w-6xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
        style={{ animation: 'modalSlideIn 0.2s ease-out' }}
      >
        <div className="flex h-[80vh] md:h-[70vh]">
          {/* Search Panel */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documentation..."
                className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto">
          {query.trim() && results.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No results found for "{query}"
            </div>
          )}

          {results.length > 0 && (
            <div className="p-2">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    index === selectedIndex
                      ? 'bg-[var(--product-primary)]/10 border border-[var(--product-primary)]/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 mt-0.5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {highlightMatch(result.title, query)}
                      </div>
                      {result.content && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {highlightMatch(result.content.substring(0, 150), query)}...
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-500 capitalize">
                          {result.category}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-600">{result.url}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!query.trim() && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Start typing to search documentation...</p>
              <div className="mt-4 text-xs space-y-2">
                <p>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">↑↓</kbd> to navigate
                </p>
                <p>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Enter</kbd> to select
                </p>
                <p>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">ESC</kbd> to close
                </p>
              </div>
            </div>
          )}
            </div>
          </div>

          {/* AI Chat Panel - hidden on mobile */}
          <div className="hidden md:block w-96 flex-shrink-0">
            <AIChatPanel onClose={onClose} />
          </div>
        </div>
      </div>
    </div>
  )
}
