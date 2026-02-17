import { ReactNode } from 'react'

interface CalloutProps {
  children: ReactNode
}

export function Note({ children }: CalloutProps) {
  return (
    <div className="note my-4 p-4 rounded-lg backdrop-blur-md border-l-4 border-blue-500 bg-blue-500/5">
      <div className="flex items-start gap-3">
        <span className="text-blue-500 flex-shrink-0 text-xl leading-6">ℹ️</span>
        <div className="text-gray-700 dark:text-gray-300 text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
          {children}
        </div>
      </div>
    </div>
  )
}

export function Tip({ children }: CalloutProps) {
  return (
    <div className="tip my-4 p-4 rounded-lg backdrop-blur-md border-l-4 border-green-500 bg-green-500/5">
      <div className="flex items-start gap-3">
        <span className="text-green-500 flex-shrink-0 text-xl leading-6">💡</span>
        <div className="text-gray-700 dark:text-gray-300 text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
          {children}
        </div>
      </div>
    </div>
  )
}

export function Warning({ children }: CalloutProps) {
  return (
    <div className="warning my-4 p-4 rounded-lg backdrop-blur-md border-l-4 border-orange-500 bg-orange-500/5">
      <div className="flex items-start gap-3">
        <span className="text-orange-500 flex-shrink-0 text-xl leading-6">⚠️</span>
        <div className="text-gray-700 dark:text-gray-300 text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
          {children}
        </div>
      </div>
    </div>
  )
}

export function Danger({ children }: CalloutProps) {
  return (
    <div className="danger my-4 p-4 rounded-lg backdrop-blur-md border-l-4 border-red-500 bg-red-500/5">
      <div className="flex items-start gap-3">
        <span className="text-red-500 flex-shrink-0 text-xl leading-6">🚨</span>
        <div className="text-gray-700 dark:text-gray-300 text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
          {children}
        </div>
      </div>
    </div>
  )
}

export function Info({ children }: CalloutProps) {
  return <Note>{children}</Note>
}

export function Check({ children }: CalloutProps) {
  return (
    <div className="check my-4 p-4 rounded-lg backdrop-blur-md border-l-4 border-green-500 bg-green-500/5">
      <div className="flex items-start gap-3">
        <span className="text-green-500 flex-shrink-0 text-xl leading-6">✅</span>
        <div className="text-gray-700 dark:text-gray-300 text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
          {children}
        </div>
      </div>
    </div>
  )
}
