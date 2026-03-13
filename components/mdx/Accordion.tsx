'use client'

import { ReactNode, useState } from 'react'
import {
  Shield,
  GraduationCap,
  Search,
  User,
  Award,
  BookOpenText,
  LucideIcon
} from 'lucide-react'

interface AccordionGroupProps {
  children: ReactNode
}

interface AccordionProps {
  title: string
  icon?: string
  children: ReactNode
  defaultOpen?: boolean
}

export function AccordionGroup({ children }: AccordionGroupProps) {
  return (
    <div className="accordion-group space-y-3 my-6">
      {children}
    </div>
  )
}

export function Accordion({ title, icon, children, defaultOpen = false }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  // Icon mapping from FontAwesome names to Lucide components
  const iconMap: Record<string, LucideIcon> = {
    'shield-halved': Shield,
    'shield': Shield,
    'graduation-cap': GraduationCap,
    'diploma': GraduationCap,
    'magnifying-glass': Search,
    'user': User,
    'award': Award,
    'book-open-reader': BookOpenText,
  }

  const IconComponent = icon ? iconMap[icon] : null

  return (
    <div className="accordion-item glass rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="accordion-header w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {IconComponent && <IconComponent className="w-5 h-5 text-current opacity-70" strokeWidth={1.5} />}
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </span>
        </div>
        <div className={`flex items-center justify-center w-7 h-7 rounded-md bg-gray-100 dark:bg-gray-800 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <svg
            className="w-4 h-4 text-gray-600 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="accordion-content p-4 pt-0 text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700">
          {children}
        </div>
      )}
    </div>
  )
}
