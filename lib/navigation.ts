import docsConfig from '../config/docs.json'

export interface NavPage {
  title?: string
  pages?: (string | NavPage | NavGroup)[]
}

export interface NavGroup {
  group: string
  pages: (string | NavPage)[]
}

export interface NavDivider {
  divider: true
}

export interface NavDropdown {
  dropdown: string
  icon: string
  pages: (string | NavPage | NavGroup | NavDivider)[]
}

export interface NavTab {
  tab: string
  dropdowns?: NavDropdown[]
}

export interface NavAnchor {
  anchor: string
  href: string
  icon: string
}

export interface NavigationConfig {
  tabs: NavTab[]
  global?: {
    anchors?: NavAnchor[]
  }
}

export function getNavigation(): NavigationConfig {
  return docsConfig.navigation as NavigationConfig
}

export function getDocsConfig() {
  return docsConfig
}

export function getAllPagePaths(): string[] {
  const navigation = getNavigation()
  const paths: string[] = []

  function extractPaths(items: (string | NavPage | NavGroup | NavDivider)[]): void {
    items.forEach((item) => {
      if (typeof item === 'string') {
        paths.push(item)
      } else if ('divider' in item) {
        // skip dividers
      } else if ('group' in item) {
        extractPaths(item.pages)
      } else if ('pages' in item) {
        if (item.pages) {
          extractPaths(item.pages)
        }
      }
    })
  }

  navigation.tabs.forEach((tab) => {
    if (tab.dropdowns) {
      tab.dropdowns.forEach((dropdown) => {
        extractPaths(dropdown.pages)
      })
    }
  })

  return paths
}

export function getPageTitle(path: string): string {
  // Convert path to title (e.g., "codehawks/overview" -> "Overview")
  const parts = path.split('/')
  const last = parts[parts.length - 1]
  return last
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
