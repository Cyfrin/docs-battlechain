import { ReactNode } from 'react'

interface ResponseFieldProps {
  name: string
  type?: string
  required?: boolean
  children?: ReactNode
}

export function ResponseField({ name, type, required, children }: ResponseFieldProps) {
  return (
    <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-baseline gap-2 mb-2">
        <code className="text-sm font-mono font-semibold text-[var(--product-primary)]">
          {name}
        </code>
        {type && (
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
            {type}
          </span>
        )}
        {required && (
          <span className="text-xs font-semibold text-red-500">required</span>
        )}
      </div>
      {children && (
        <div className="text-sm text-gray-700 dark:text-gray-300 ml-2">
          {children}
        </div>
      )}
    </div>
  )
}
