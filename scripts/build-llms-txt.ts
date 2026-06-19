import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { stripMdxToMarkdown } from '../lib/strip-mdx'

const CONTENT_DIR = path.join(process.cwd(), 'content')
const OUTPUT_DIR = path.join(process.cwd(), 'public')
const SITE_TITLE = 'BattleChain Docs'
const SITE_DESCRIPTION =
  'BattleChain is a pre-mainnet, post-testnet blockchain for stress-testing' +
  ' smart contracts with real funds. Protocols deploy audited contracts,' +
  ' whitehats legally attack them for bounties under Safe Harbor protection,' +
  ' and battle-tested contracts promote to mainnet.'

const docsConfig = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), '.docs-config.json'),
    'utf-8',
  ),
)
const BASE_URL = `https://${docsConfig.production_url}`

interface PageMeta {
  pagePath: string
  title: string
  description: string
  content: string
}

interface NavGroup {
  name: string
  pages: PageMeta[]
}

// ── Nav extraction ──────────────────────────────────────────────

function readPageMeta(pagePath: string): PageMeta | null {
  const filePath = path.join(CONTENT_DIR, `${pagePath}.mdx`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)

  return {
    pagePath,
    title: data.title ?? toTitleCase(pagePath),
    description: data.description ?? '',
    content,
  }
}

function toTitleCase(pagePath: string): string {
  const last = pagePath.split('/').pop() ?? pagePath
  return last
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * Walk docs.json nav tree, returning pages grouped by section.
 * Nested sub-groups (e.g. "For Protocols" inside "How-to Guides")
 * are flattened into their parent group.
 */
function extractNavGroups(): NavGroup[] {
  const config = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), 'config', 'docs.json'),
      'utf-8',
    ),
  )

  const topItems: unknown[] =
    config.navigation.tabs[0].dropdowns[0].pages
  const groups: NavGroup[] = []
  let ungrouped: PageMeta[] = []

  function collectPages(
    items: unknown[],
    into: PageMeta[],
  ): void {
    for (const item of items) {
      if (typeof item === 'string') {
        const meta = readPageMeta(item)
        if (meta) into.push(meta)
      } else if (
        item !== null &&
        typeof item === 'object' &&
        'group' in item
      ) {
        const g = item as { group: string; pages: unknown[] }
        collectPages(g.pages, into)
      }
      // dividers and other items are skipped
    }
  }

  for (const item of topItems) {
    if (typeof item === 'string') {
      const meta = readPageMeta(item)
      if (meta) ungrouped.push(meta)
    } else if (
      item !== null &&
      typeof item === 'object' &&
      'divider' in item
    ) {
      if (ungrouped.length > 0) {
        groups.push({ name: 'Overview', pages: ungrouped })
        ungrouped = []
      }
    } else if (
      item !== null &&
      typeof item === 'object' &&
      'group' in item
    ) {
      // Flush ungrouped pages first
      if (ungrouped.length > 0) {
        groups.push({ name: 'Overview', pages: ungrouped })
        ungrouped = []
      }
      const g = item as { group: string; pages: unknown[] }
      const pages: PageMeta[] = []
      collectPages(g.pages, pages)
      if (pages.length > 0) {
        groups.push({ name: g.group, pages })
      }
    }
  }

  // Remaining ungrouped pages at the end (explanations)
  if (ungrouped.length > 0) {
    groups.push({ name: 'Concepts', pages: ungrouped })
  }

  return groups
}

// ── Generators ──────────────────────────────────────────────────

function buildLlmsTxt(groups: NavGroup[]): string {
  const lines: string[] = [
    `# ${SITE_TITLE}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
  ]

  for (const group of groups) {
    lines.push(`## ${group.name}`)
    lines.push('')
    for (const page of group.pages) {
      const url = `${BASE_URL}/${page.pagePath}`
      const desc = page.description
        ? `: ${page.description}`
        : ''
      lines.push(`- [${page.title}](${url})${desc}`)
    }
    lines.push('')
  }

  lines.push('## Machine-readable resources')
  lines.push('')
  lines.push(
    `- [Deployments JSON](${BASE_URL}/deployments.json): All BattleChain networks, chain IDs, RPC/explorer URLs, and contract addresses as structured JSON`,
  )
  lines.push(
    `- [Full docs as markdown](${BASE_URL}/llms-full.txt): Complete text of every page in one file`,
  )
  lines.push(
    `- [Docs MCP server](${BASE_URL}/api/mcp): Streamable HTTP MCP endpoint exposing search_docs, read_page, and list_pages`,
  )
  lines.push('')

  return lines.join('\n').trim() + '\n'
}

function buildLlmsFullTxt(groups: NavGroup[]): string {
  const sections: string[] = [
    `# ${SITE_TITLE}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
  ]

  for (const group of groups) {
    sections.push(`---`)
    sections.push('')
    sections.push(`## ${group.name}`)
    sections.push('')
    for (const page of group.pages) {
      const clean = stripMdxToMarkdown(page.content)
      sections.push(`### ${page.title}`)
      sections.push(`Source: ${BASE_URL}/${page.pagePath}`)
      sections.push('')
      if (page.description) {
        sections.push(`*${page.description}*`)
        sections.push('')
      }
      sections.push(clean)
      sections.push('')
    }
  }

  return sections.join('\n').trim() + '\n'
}

// ── Main ────────────────────────────────────────────────────────

const groups = extractNavGroups()
const totalPages = groups.reduce(
  (sum, g) => sum + g.pages.length,
  0,
)

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

const llmsTxt = buildLlmsTxt(groups)
fs.writeFileSync(path.join(OUTPUT_DIR, 'llms.txt'), llmsTxt)

const llmsFullTxt = buildLlmsFullTxt(groups)
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'llms-full.txt'),
  llmsFullTxt,
)

console.log(
  `✓ Built llms.txt (${groups.length} sections, ${totalPages} pages)`,
)
console.log(
  `✓ Built llms-full.txt (${(llmsFullTxt.length / 1024).toFixed(1)} KB)`,
)
