'use client'

import { ReactNode, useState, Children } from 'react'

interface CodeGroupProps {
  children: ReactNode
  labels?: string
}

export function CodeGroup({ children, labels }: CodeGroupProps) {
  const [activeTab, setActiveTab] = useState(0)
  const childArray = Children.toArray(children)

  const getLanguageFromChild = (child: unknown): string => {
    const childWithProps = child as { props?: { children?: { props?: { className?: string } } } }
    if (childWithProps?.props?.children?.props?.className) {
      const match = childWithProps.props.children.props.className.match(/language-(\w+)/)
      return match ? match[1] : 'code'
    }
    return 'code'
  }

  const customLabels = labels
    ? labels.split(',').map((l) => l.trim())
    : null
  const tabs = customLabels ?? childArray.map((child) => getLanguageFromChild(child))

  return (
    <div className="code-group my-6 rounded-lg overflow-hidden glass border border-gray-200 dark:border-gray-700">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === index
                ? 'text-[var(--product-primary)] border-b-2 border-[var(--product-primary)] bg-white dark:bg-gray-900'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {customLabels ? tab : tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Code Content */}
      <div className="code-content">
        {childArray[activeTab]}
      </div>
    </div>
  )
}
