import { ReactNode } from 'react'

interface LatexProps {
  children: ReactNode
}

export function Latex({ children }: LatexProps) {
  // For now, just render the children in a code-like format
  // In the future, we can integrate a proper LaTeX renderer like KaTeX
  return (
    <code className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
      {children}
    </code>
  )
}
