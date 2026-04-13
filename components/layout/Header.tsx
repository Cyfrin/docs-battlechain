'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from '../theme/ThemeProvider'
import { getDocsConfig } from '@/lib/navigation'
import { SearchButton } from '../search/SearchButton'
import { useMobileSidebar } from '@/lib/mobile-sidebar'

interface NavLink {
  label: string
  href: string
}

interface NavbarConfig {
  links?: NavLink[]
  primary?: {
    type?: string
    label: string
    href: string
  }
}

function BattlechainMarkIcon({ className }: { className?: string }) {
  return (
    <svg
      width="157"
      height="126"
      viewBox="0 0 157 126"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path d="M69.7945 94.0566C72.9271 97.428 74.6673 101.853 74.6673 106.448V125.132L49.5798 100.188L60.8621 84.5927L69.7945 94.0566Z" fill="currentColor"/>
      <path d="M42.9307 105.619L23.028 105.111L37.9363 125.132H74.6673L42.9307 105.619Z" fill="currentColor"/>
      <path d="M60.8621 73.4008L37.379 95.6358L37.1313 62.4459L60.8621 51.0583V73.4008Z" fill="currentColor"/>
      <path d="M10.9351 84.5927L37.379 95.6358L22.1454 69.4976L0 61.9852L10.9351 84.5927Z" fill="currentColor"/>
      <path d="M27.9042 32.4979L26.0944 62.4459L8.07046 37.8583L17.89 15.0836L27.9042 32.4979Z" fill="currentColor"/>
      <path d="M60.8621 43.5478L26.0944 62.4459L37.2728 37.8583H60.8621V43.5478Z" fill="currentColor"/>
      <path d="M68.8058 21.8872V0L37.9363 12.6788L37.1313 30.8299L68.8058 21.8872Z" fill="currentColor"/>
      <path d="M87.1347 94.3046C84.0021 97.676 82.2619 102.101 82.2619 106.696V125.38L107.349 100.436L96.0671 84.8408L87.1347 94.3046Z" fill="currentColor"/>
      <path d="M113.998 105.867L133.901 105.359L118.993 125.38H82.2619L113.998 105.867Z" fill="currentColor"/>
      <path d="M96.0671 73.6488L119.55 95.8838L119.798 62.694L96.0671 51.3063V73.6488Z" fill="currentColor"/>
      <path d="M145.994 84.8408L119.55 95.8838L134.784 69.7456L156.929 62.2332L145.994 84.8408Z" fill="currentColor"/>
      <path d="M129.025 32.7459L130.835 62.694L148.859 38.1064L139.039 15.3316L129.025 32.7459Z" fill="currentColor"/>
      <path d="M96.0671 43.7959L130.835 62.694L119.656 38.1064H96.0671V43.7959Z" fill="currentColor"/>
      <path d="M88.1234 22.1353V0.248047L118.993 12.9269L119.798 31.078L88.1234 22.1353Z" fill="currentColor"/>
    </svg>
  )
}

export function Header() {
  const { theme, toggleTheme } = useTheme()
  const config = getDocsConfig()
  const navbar = config.navbar as NavbarConfig
  const { toggle } = useMobileSidebar()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white dark:border-[#333741] dark:bg-[#0E1119]">
      <div className="flex h-14 md:h-16 items-center justify-between px-4 gap-4">
        {/* Hamburger + Logo */}
        <div className="flex items-center gap-2">
          {/* Hamburger - mobile only */}
          <button
            type="button"
            onClick={toggle}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors dark:text-gray-100 dark:hover:bg-white/10"
            aria-label="Toggle navigation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link href="/" className="flex items-center">
            <span className="flex items-center text-[#004DFF] dark:text-white md:hidden">
              <BattlechainMarkIcon className="block h-8 w-auto" />
            </span>
            <Image
              src={theme === 'dark' ? '/images/product-logos/battlechain-dark.svg' : '/images/product-logos/battlechain.svg'}
              alt="BattleChain"
              width={148}
              height={19}
              priority
              className="hidden h-5 w-auto md:block md:h-6"
            />
          </Link>
        </div>

        {/* Search + Navigation Links */}
        <div className="flex items-center gap-2 md:gap-4">
          <div>
            <SearchButton />
          </div>

          <nav className="flex items-center space-x-2 md:space-x-6">
          {navbar?.links?.map((link, index) => (
            <a
              key={index}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-300 dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors dark:text-gray-100 dark:hover:bg-white/10"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </nav>
        </div>
      </div>
    </header>
  )
}
