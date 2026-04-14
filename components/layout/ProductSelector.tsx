'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTheme } from '../theme/ThemeProvider'

interface Product {
  id: string
  name: string
  icon: string
  href: string
  color: string
}

interface ProductSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectProduct: (productId: string) => void
}

const PRODUCTS: Product[] = [
  {
    id: 'profiles',
    name: 'Profiles',
    icon: '/images/product-logos/cyfrin.svg',
    href: '/profiles/overview',
    color: '#004DFF'
  },
  {
    id: 'codehawks',
    name: 'CodeHawks',
    icon: '/images/product-logos/codehawks.svg',
    href: '/codehawks/overview',
    color: '#FF4405'
  },
  {
    id: 'updraft',
    name: 'Updraft',
    icon: '/images/product-logos/updraft.svg',
    href: '/updraft/overview',
    color: '#66C61C'
  },
  {
    id: 'solodit',
    name: 'Solodit',
    icon: '/images/product-logos/solodit.svg',
    href: '/solodit/overview',
    color: '#9E77ED'
  },
  {
    id: 'battlechain',
    name: 'BattleChain',
    icon: '/images/product-logos/battlechain.svg',
    href: '/battlechain/overview',
    color: '#FFFFFF'
  }
]

export function ProductSelector({ isOpen, onClose, onSelectProduct }: ProductSelectorProps) {
  const router = useRouter()
  const modalRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleProductClick = (product: Product) => {
    onSelectProduct(product.id)
    router.push(product.href)
    onClose()
  }

  const getProductIconSrc = (product: Product) => {
    if (product.id === 'battlechain') {
      return theme === 'dark'
        ? '/images/product-logos/battlechain-dark.svg'
        : '/images/product-logos/battlechain.svg'
    }

    return product.icon
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm" />

      <div
        ref={modalRef}
        className="relative w-full max-w-sm mx-4 product-selector-modal"
      >
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Select a Product
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {PRODUCTS.map((product) => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="product-selector-item flex flex-col items-center gap-3 p-4 rounded-2xl transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
                style={
                  {
                    '--product-color': product.color,
                  } as React.CSSProperties
                }
              >
                <div className="w-12 h-12 flex items-center justify-center">
                  <Image
                    src={getProductIconSrc(product)}
                    alt={product.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                  {product.name}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                onSelectProduct('all')
                router.push('/')
                onClose()
              }}
              className="w-full py-2 px-4 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Show All Products
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
