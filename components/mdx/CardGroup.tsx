import { ReactNode } from 'react'

interface CardGroupProps {
  cols?: number
  children: ReactNode
}

export function CardGroup({ cols = 2, children }: CardGroupProps) {
  // Map cols to Tailwind grid classes
  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'sm:grid-cols-2 md:grid-cols-3',
    4: 'sm:grid-cols-2 md:grid-cols-4',
  }[cols] || 'md:grid-cols-2'

  return (
    <div className={`grid grid-cols-1 ${gridColsClass} gap-4 my-6`}>
      {children}
    </div>
  )
}
