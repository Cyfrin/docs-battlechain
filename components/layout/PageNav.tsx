import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AdjacentPage } from '@/lib/navigation'

interface PageNavProps {
  prev: AdjacentPage | null
  next: AdjacentPage | null
}

export function PageNav({ prev, next }: PageNavProps) {
  if (!prev && !next) {
    return null
  }

  return (
    <nav
      aria-label="Page navigation"
      className="not-prose mt-16 flex items-stretch gap-4 border-t border-gray-200 dark:border-gray-700 pt-8"
    >
      {prev ? (
        <Link
          href={`/${prev.path}`}
          className="group flex flex-1 items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 no-underline transition-colors hover:border-[var(--product-primary)] hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          <ChevronLeft className="w-4 h-4 shrink-0 text-gray-400 group-hover:text-[var(--product-primary)] transition-colors" />
          <div className="text-left">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Previous
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {prev.title}
            </div>
          </div>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
      {next ? (
        <Link
          href={`/${next.path}`}
          className="group flex flex-1 items-center justify-end gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 no-underline transition-colors hover:border-[var(--product-primary)] hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Next
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {next.title}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0 text-gray-400 group-hover:text-[var(--product-primary)] transition-colors" />
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </nav>
  )
}
