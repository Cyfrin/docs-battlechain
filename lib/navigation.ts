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

export interface AdjacentPage {
  path: string
  title: string
}

export interface AdjacentPages {
  prev: AdjacentPage | null
  next: AdjacentPage | null
}

export function getAdjacentPages(currentPath: string): AdjacentPages {
  const allPaths = getAllPagePaths()
  const index = allPaths.indexOf(currentPath)

  if (index === -1) {
    return { prev: null, next: null }
  }

  const prev = index > 0
    ? { path: allPaths[index - 1], title: getPageTitle(allPaths[index - 1]) }
    : null
  const next = index < allPaths.length - 1
    ? { path: allPaths[index + 1], title: getPageTitle(allPaths[index + 1]) }
    : null

  return { prev, next }
}
