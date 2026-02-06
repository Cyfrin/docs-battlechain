import { ReactNode } from 'react'

interface SnippetIntroProps {
  children: ReactNode
}

export function SnippetIntro({ children }: SnippetIntroProps) {
  return (
    <div className="my-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg">
      <div className="text-sm text-gray-700 dark:text-gray-300">
        {children}
      </div>
    </div>
  )
}
