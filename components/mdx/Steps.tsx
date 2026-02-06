import { ReactNode } from 'react'

interface StepsProps {
  children: ReactNode
}

interface StepProps {
  title?: string
  children: ReactNode
}

export function Steps({ children }: StepsProps) {
  return (
    <div className="steps-container my-8 space-y-6">
      {children}
    </div>
  )
}

export function Step({ title, children }: StepProps) {
  return (
    <div className="step-item flex gap-4">
      <div className="step-number-container flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[var(--product-primary)] to-[var(--product-dark)] flex items-center justify-center text-white font-semibold text-sm shadow-lg before:content-[counter(step)]">
      </div>
      <div className="step-content flex-1">
        {title && (
          <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
            {title}
          </h4>
        )}
        <div className="text-gray-700 dark:text-gray-300">
          {children}
        </div>
      </div>
    </div>
  )
}
