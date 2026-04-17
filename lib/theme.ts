export interface ProductTheme {
  name: string
  primary: string
  light: string
  dark: string
  rgb: string
  className: string
}

export const PRODUCT_THEMES: Record<string, ProductTheme> = {
  codehawks: {
    name: 'CodeHawks',
    primary: '#FF4405',
    light: '#FF692E',
    dark: '#E62E05',
    rgb: '255, 68, 5',
    className: 'product-codehawks',
  },
  updraft: {
    name: 'Updraft',
    primary: '#66C61C',
    light: '#85E13A',
    dark: '#4CA30D',
    rgb: '102, 198, 28',
    className: 'product-updraft',
  },
  solodit: {
    name: 'Solodit',
    primary: '#9E77ED',
    light: '#B692F6',
    dark: '#7F56D9',
    rgb: '158, 119, 237',
    className: 'product-solodit',
  },
  battlechain: {
    name: 'BattleChain',
    primary: '#FFFFFF',
    light: '#F5F5F5',
    dark: '#E8E8E8',
    rgb: '255, 255, 255',
    className: 'product-battlechain',
  },
  profiles: {
    name: 'Profiles',
    primary: '#004DFF',
    light: '#004DFF',
    dark: '#004DFF',
    rgb: '0, 77, 255',
    className: 'product-profiles',
  },
}

export function detectProductFromPath(pathname: string): string | null {
  if (pathname.includes('/codehawks')) return 'codehawks'
  if (pathname.includes('/updraft')) return 'updraft'
  if (pathname.includes('/solodit')) return 'solodit'
  if (pathname.includes('/battlechain')) return 'battlechain'
  if (pathname.includes('/profiles')) return 'profiles'
  return null
}

export function getProductTheme(product: string | null): ProductTheme | null {
  if (!product) return null
  return PRODUCT_THEMES[product] || null
}
