'use client'

import { useEffect } from 'react'

export function ProductThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const updateTheme = () => {
      // Detect if dark mode is active
      const isDark = document.documentElement.classList.contains('dark')

      // Battlechain theme: white in dark mode, black in light mode
      const theme = isDark
        ? {
            primary: '#FFFFFF',
            light: '#FFFFFF',
            dark: '#CCCCCC',
            rgb: '255, 255, 255',
            className: 'product-battlechain'
          }
        : {
            primary: '#000000',
            light: '#333333',
            dark: '#000000',
            rgb: '0, 0, 0',
            className: 'product-battlechain'
          }

      // Apply CSS variables for Battlechain colors
      document.documentElement.style.setProperty('--product-primary', theme.primary)
      document.documentElement.style.setProperty('--product-light', theme.light)
      document.documentElement.style.setProperty('--product-dark', theme.dark)
      document.documentElement.style.setProperty('--product-rgb', theme.rgb)

      // Add Battlechain class to body
      document.body.classList.add(theme.className)
    }

    // Initial theme setup
    updateTheme()

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateTheme()
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  return <>{children}</>
}
