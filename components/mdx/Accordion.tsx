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
    <div className="accordion-item glass rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="accordion-header w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {IconComponent && <IconComponent className="w-5 h-5 text-current opacity-70" strokeWidth={1.5} />}
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="accordion-content p-4 pt-0 text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700">
          {children}
        </div>
      )}
    </div>
  )
}
