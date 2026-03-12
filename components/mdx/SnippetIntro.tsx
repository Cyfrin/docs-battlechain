import { ReactNode } from 'react'

interface SnippetIntroProps {
  children: ReactNode
}

export function SnippetIntro({ children }: SnippetIntroProps) {
  return (
    <div className="my-4 p-4 bg-[#004DFF]/5 dark:bg-[#004DFF]/15 border-l-4 border-[#004DFF] rounded-r-lg">
      <div className="text-sm text-gray-700 dark:text-gray-300">
        {children}
      </div>
    </div>
  )
}
