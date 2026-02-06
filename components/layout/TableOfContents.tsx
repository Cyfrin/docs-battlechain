'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface Heading {
  id: string
  text: string
  level: number
}

export function TableOfContents() {
  const pathname = usePathname()
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    // Extract all h2 and h3 headings from the main content
    const mainContent = document.querySelector('main')
    if (!mainContent) return

    const headingElements = mainContent.querySelectorAll('h2, h3')
    const headingData: Heading[] = []

    headingElements.forEach((heading) => {
      // Skip headings marked to ignore (like card titles)
      if (heading.hasAttribute('data-toc-ignore')) {
        return
      }

      // Create ID from text if it doesn't have one
      if (!heading.id) {
        const id = heading.textContent
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
        if (id) {
          heading.id = id
        }
      }

      if (heading.id && heading.textContent) {
        headingData.push({
          id: heading.id,
          text: heading.textContent,
          level: parseInt(heading.tagName[1]),
        })
      }
    })

    setHeadings(headingData)

    // Set up intersection observer for active heading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '0px 0px -80% 0px' }
    )

    headingElements.forEach((heading) => {
      if (heading.id) {
        observer.observe(heading)
      }
    })

    return () => {
      headingElements.forEach((heading) => {
        if (heading.id) {
          observer.unobserve(heading)
        }
      })
    }
  }, [pathname])

  if (headings.length === 0) {
    return null
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const offset = 80 // account for sticky header
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  return (
    <aside className="hidden xl:block sticky top-20 w-64 h-[calc(100vh-5rem)] overflow-y-auto flex-shrink-0 pl-8">
      <div className="pb-8">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
          On This Page
        </h4>
        <nav>
          <ul className="space-y-2 text-sm">
            {headings.map((heading) => (
              <li
                key={heading.id}
                className={heading.level === 3 ? 'pl-4' : ''}
              >
                <a
                  href={`#${heading.id}`}
                  onClick={(e) => handleClick(e, heading.id)}
                  className={`block py-1 transition-colors border-l-2 pl-3 -ml-px ${
                    activeId === heading.id
                      ? 'border-[var(--product-primary)] text-[var(--product-primary)] font-medium'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  )
}
