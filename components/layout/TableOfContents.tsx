'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface Heading {
  id: string
  text: string
  level: number
}

const GITHUB_REPO = 'Cyfrin/docs-battlechain'
const GITHUB_BRANCH = 'main'

function getGitHubEditUrl(pathname: string): string {
  if (pathname === '/' || pathname === '/overview') {
    return `https://github.com/${GITHUB_REPO}/edit/${GITHUB_BRANCH}/content/overview.mdx`
  }
  // /battlechain/quickstart/deploy-first-contract → content/battlechain/quickstart/deploy-first-contract.mdx
  const filePath = pathname.startsWith('/') ? pathname.slice(1) : pathname
  return `https://github.com/${GITHUB_REPO}/edit/${GITHUB_BRANCH}/content/${filePath}.mdx`
}

function getPageUrl(pathname: string): string {
  return `https://docs.battlechain.com${pathname}`
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

  const pageUrl = getPageUrl(pathname)
  const editUrl = getGitHubEditUrl(pathname)
  const chatGptUrl = `https://chatgpt.com/?q=Read ${pageUrl}`
  const claudeUrl = `https://claude.ai/new?q=Read ${pageUrl}`

  const pageActions = [
    {
      label: 'Edit this page',
      href: editUrl,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
        </svg>
      ),
    },
    {
      label: 'Open in ChatGPT',
      href: chatGptUrl,
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
        </svg>
      ),
    },
    {
      label: 'Open in Claude',
      href: claudeUrl,
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.709 15.955l4.72-10.903h2.236L6.89 15.955H4.709ZM8.837 15.955l4.72-10.903h2.235l-4.774 10.903H8.837ZM12.965 15.955l4.72-10.903H19.921l-4.775 10.903h-2.181Z" />
        </svg>
      ),
    },
    {
      label: 'Get Help',
      href: 'https://discord.gg/cyfrin',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
        </svg>
      ),
    },
  ]

  return (
    <aside className="hidden xl:block sticky top-20 w-64 h-[calc(100vh-5rem)] overflow-y-auto flex-shrink-0 pl-8">
      {headings.length > 0 && (
        <div className="pb-6">
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
      )}

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <ul className="space-y-1">
          {pageActions.map((action) => (
            <li key={action.label}>
              <a
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                {action.icon}
                <span>{action.label}</span>
                <svg className="w-3 h-3 ml-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
