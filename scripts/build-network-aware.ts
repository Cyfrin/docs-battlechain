import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

/**
 * Builds the list of pages the Mainnet/Testnet toggle should appear on.
 *
 * The toggle is only useful on pages that actually respond to it — those with a
 * `<Network title="...">` block or a bare `<NetworkInfo />` (one that follows
 * the toggle rather than pinning a network). Such pages declare
 * `networkAware: true` in frontmatter; this script collects them into
 * config/network-aware-pages.json for SubNavbar to read.
 *
 * Guardrail: if a page uses the toggle but forgot the flag, the build fails —
 * otherwise its `<Network>` blocks would silently render the wrong network.
 */

const ROOT = process.cwd()
const CONTENT_DIR = path.join(ROOT, 'content')
const OUT = path.join(ROOT, 'config', 'network-aware-pages.json')

// `<Network title=...>` (conditional block) or a bare `<NetworkInfo />`
// (no `network=` prop, so it follows the toggle).
const USES_TOGGLE = /<Network\s+title=|<NetworkInfo\s*\/>/

function walkMdx(dir: string): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkMdx(full))
    else if (entry.name.endsWith('.mdx')) out.push(full)
  }
  return out
}

const aware: string[] = []
const violations: string[] = []

for (const file of walkMdx(CONTENT_DIR)) {
  const { data, content } = matter(fs.readFileSync(file, 'utf-8'))
  const route = '/' + path.relative(CONTENT_DIR, file).replace(/\.mdx$/, '')
  const flagged = data.networkAware === true

  if (flagged) aware.push(route)
  if (USES_TOGGLE.test(content) && !flagged) violations.push(route)
}

if (violations.length > 0) {
  console.error(
    'build-network-aware: these pages use the network toggle but are missing ' +
      '`networkAware: true` in frontmatter (their <Network> blocks would render ' +
      'the wrong network):\n' +
      violations.map((v) => `  ${v}`).join('\n'),
  )
  process.exit(1)
}

aware.sort()
fs.writeFileSync(OUT, JSON.stringify(aware, null, 2) + '\n')
console.log(`✓ Wrote config/network-aware-pages.json (${aware.length} pages)`)
