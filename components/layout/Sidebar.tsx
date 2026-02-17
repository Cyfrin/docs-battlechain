'use client'

import Link from 'next/link'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getNavigation } from '@/lib/navigation'
import type { NavDropdown, NavGroup, NavPage } from '@/lib/navigation'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const navigation = getNavigation()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  // Load expanded sections from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-expanded')
    if (stored) {
      try {
        setExpandedSections(new Set(JSON.parse(stored)))
      } catch {
        // ignore parse errors
      }
    }
  }, [])

  // Auto-expand sections that contain the active page
  useEffect(() => {
    const hasActivePage = (pages: (string | NavPage | NavGroup)[]): boolean => {
      return pages.some((item) => {
        if (typeof item === 'string') {
          return pathname === `/${item}`
        }
        if ('group' in item) {
          return hasActivePage((item as NavGroup).pages)
        }
        if ('pages' in item && item.pages) {
          return hasActivePage(item.pages)
        }
        return false
      })
    }

    // Recursively find all group IDs that contain the active page
    const findGroupsToExpand = (pages: (string | NavPage | NavGroup)[]): string[] => {
      const groupsToExpand: string[] = []

      pages.forEach((item, index) => {
        // Skip strings
        if (typeof item === 'string') {
          return
        }

        if ('group' in item) {
          const group = item as NavGroup
          const groupId = `group-${group.group}-${index}`

          if (hasActivePage(group.pages)) {
            groupsToExpand.push(groupId)
            // Recursively check nested groups
            groupsToExpand.push(...findGroupsToExpand(group.pages))
          }
        }
        if ('pages' in item && item.pages) {
          groupsToExpand.push(...findGroupsToExpand(item.pages))
        }
      })

      return groupsToExpand
    }

    const sectionsToExpand = new Set<string>()

    navigation.tabs.forEach((tab) => {
      tab.dropdowns?.forEach((dropdown, index) => {
        const dropdownId = `dropdown-${dropdown.dropdown}-${index}`
        if (hasActivePage(dropdown.pages)) {
          // Expand the dropdown
          sectionsToExpand.add(dropdownId)

          // Find and expand all nested groups that contain the active page
          const groupIds = findGroupsToExpand(dropdown.pages)
          groupIds.forEach(id => sectionsToExpand.add(id))
        }
      })
    })

    // Only update state if there are new sections to expand
    if (sectionsToExpand.size > 0) {
      setExpandedSections((prev) => {
        const next = new Set(prev)
        let hasChanges = false

        sectionsToExpand.forEach(id => {
          if (!next.has(id)) {
            next.add(id)
            hasChanges = true
          }
        })

        if (hasChanges) {
          localStorage.setItem('sidebar-expanded', JSON.stringify(Array.from(next)))
          return next
        }
        return prev
      })
    }
  }, [pathname])

  // Save expanded sections to localStorage
  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      localStorage.setItem('sidebar-expanded', JSON.stringify(Array.from(next)))
      return next
    })
  }

  const renderPages = (pages: (string | NavPage | NavGroup)[], level: number = 0, skipFirstGroup: boolean = false): JSX.Element[] => {
    const result: JSX.Element[] = []

    pages.forEach((item, index) => {
      // Handle string pages (simple links)
      if (typeof item === 'string') {
        const href = `/${item}`
        const isActive = pathname === href
        const title = item.split('/').pop()?.split('-').map(w =>
          w.charAt(0).toUpperCase() + w.slice(1)
        ).join(' ') || item

        result.push(
          <li key={`${item}-${index}`}>
            <Link
              href={href}
              className={`block px-3 py-2 rounded-lg text-sm transition-all ${
                isActive
                  ? 'sidebar-link-active font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {title}
            </Link>
          </li>
        )
        return
      }

      // Handle group objects
      if ('group' in item) {
        const group = item as NavGroup

        // Skip the first group if it has the same name as the parent dropdown
        if (skipFirstGroup && index === 0) {
          result.push(...renderPages(group.pages, level, false))
          return
        }

        const groupId = `group-${group.group}-${index}`
        const isExpanded = expandedSections.has(groupId)

        result.push(
          <li key={groupId} className="mt-2">
            <button
              type="button"
              onClick={() => toggleSection(groupId)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <span>{group.group}</span>
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {isExpanded && (
              <ul className="ml-3 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
                {renderPages(group.pages, level + 1, false)}
              </ul>
            )}
          </li>
        )
        return
      }

      // Handle page objects with nested pages
      if ('pages' in item && item.pages) {
        const page = item as NavPage
        if (page.pages) {
          result.push(...renderPages(page.pages, level, skipFirstGroup))
        }
      }
    })

    return result
  }

  const renderDropdown = (dropdown: NavDropdown, index: number) => {
    // Skip Welcome dropdown - we don't use it
    if (dropdown.dropdown === 'Welcome') {
      return null
    }

    // Render Battlechain dropdown directly without header
    if (dropdown.dropdown === 'Battlechain') {
      return (
        <div key={`battlechain-${index}`} className="mb-2">
          <ul className="space-y-1">
            {renderPages(dropdown.pages, 0, false)}
          </ul>
        </div>
      )
    }

    // For any other dropdown, render normally
    return null
  }

  return (
    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 flex-shrink-0 overflow-y-auto border-r border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md">
      <nav className="p-4">
        {navigation.tabs.map((tab) => (
          <div key={tab.tab}>
            {tab.dropdowns?.map((dropdown, index) => renderDropdown(dropdown, index))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
