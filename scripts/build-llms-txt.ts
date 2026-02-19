import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const CONTENT_DIR = path.join(process.cwd(), 'content')
const OUTPUT_DIR = path.join(process.cwd(), 'public')
const SITE_TITLE = 'BattleChain Docs'
const SITE_DESCRIPTION =
  'BattleChain is a pre-mainnet, post-testnet blockchain for stress-testing' +
  ' smart contracts with real funds. Protocols deploy audited contracts,' +
  ' whitehats legally attack them for bounties under Safe Harbor protection,' +
  ' and battle-tested contracts promote to mainnet.'

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

// ── MDX → clean markdown ────────────────────────────────────────

function stripMdxToMarkdown(raw: string): string {
  // Protect fenced code blocks from tag/brace stripping
  const codeBlocks: string[] = []
  let text = raw.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match)
    return `%%CODE${codeBlocks.length - 1}%%`
  })

  // Convert callout components to blockquotes
  const callouts: [string, string][] = [
    ['Note', 'Note'],
    ['Info', 'Note'],
    ['Warning', 'Warning'],
    ['Danger', 'Danger'],
    ['Tip', 'Tip'],
    ['Check', 'Check'],
  ]
  for (const [tag, label] of callouts) {
    const re = new RegExp(
      `<${tag}>\\s*([\\s\\S]*?)\\s*</${tag}>`,
      'g',
    )
    text = text.replace(re, (_match, body: string) => {
      const lines = body.trim().split('\n')
      return lines
        .map((l, i) =>
          i === 0 ? `> **${label}:** ${l}` : `> ${l}`,
        )
        .join('\n')
    })
  }

  // Convert Card components with href to markdown links
  text = text.replace(
    /<Card\s+[^>]*?title="([^"]*)"[^>]*?href="([^"]*)"[^>]*>\s*([\s\S]*?)\s*<\/Card>/g,
    (_m, title: string, href: string, body: string) =>
      `- [${title}](${href}): ${body.trim()}`,
  )
  // Also match href before title
  text = text.replace(
    /<Card\s+[^>]*?href="([^"]*)"[^>]*?title="([^"]*)"[^>]*>\s*([\s\S]*?)\s*<\/Card>/g,
    (_m, href: string, title: string, body: string) =>
      `- [${title}](${href}): ${body.trim()}`,
  )

  // Convert Card/Step components without href — extract title
  text = text.replace(
    /<(?:Card|Step)\s+[^>]*?title="([^"]*)"[^>]*>\s*([\s\S]*?)\s*<\/(?:Card|Step)>/g,
    (_m, title: string, body: string) =>
      `**${title}**\n${body.trim()}`,
  )

  // Remove self-closing JSX tags (<Component /> and <br/>)
  text = text.replace(/<[A-Za-z][A-Za-z0-9.]*\b[^>]*\/>/g, '')

  // Remove opening and closing HTML/JSX tags, keep children
  text = text.replace(/<\/?[A-Za-z][A-Za-z0-9.]*\b[^>]*>/g, '')

  // Remove stray JSX expressions (style={{...}}, className="...")
  // that may remain on their own lines after tag removal
  text = text.replace(/^\s*\{[^}]*\}\s*$/gm, '')

  // Collapse runs of 3+ blank lines into 2
  text = text.replace(/\n{3,}/g, '\n\n')

  // Restore code blocks
  text = text.replace(/%%CODE(\d+)%%/g, (_, i) =>
    codeBlocks[parseInt(i, 10)],
  )

  return text.trim()
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
      const url = `/${page.pagePath}`
      const desc = page.description
        ? `: ${page.description}`
        : ''
      lines.push(`- [${page.title}](${url})${desc}`)
    }
    lines.push('')
  }

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
