const BASE_URL = 'https://docs.battlechain.com'

const NETWORK_INFO: Record<string, string> = {
  testnet: [
    '| Field | Value |',
    '|-------|-------|',
    '| Network Name | BattleChain Testnet |',
    '| Chain ID | `627` |',
    '| RPC URL | `https://testnet.battlechain.com` |',
    '| Explorer | https://explorer.testnet.battlechain.com/ |',
    '| Currency | ETH |',
    '| CAIP-2 ID | `eip155:627` |',
  ].join('\n'),
  mainnet: [
    '| Field | Value |',
    '|-------|-------|',
    '| Network Name | BattleChain |',
    '| Chain ID | `626` |',
    '| RPC URL | `https://mainnet.battlechain.com` |',
    '| Explorer | https://explorer.mainnet.battlechain.com/ |',
    '| Currency | ETH |',
    '| CAIP-2 ID | `eip155:626` |',
  ].join('\n'),
}

/**
 * Convert raw MDX content to clean markdown suitable for AI consumption.
 * Strips JSX components and replaces them with readable markdown equivalents.
 */
export function stripMdxToMarkdown(raw: string): string {
  // Protect fenced code blocks from tag/brace stripping
  const codeBlocks: string[] = []
  let text = raw.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match)
    return `%%CODE${codeBlocks.length - 1}%%`
  })

  // Convert Tab components to labeled sections
  text = text.replace(
    /<Tab\s+title="([^"]*)"[^>]*>/g,
    (_m, title: string) => `\n**[${title}]**\n`,
  )
  text = text.replace(/<\/Tab>/g, '')

  // Remove Tabs wrapper (keep children)
  text = text.replace(/<\/?Tabs[^>]*>/g, '')

  // Inline <NetworkInfo /> components with actual network data
  text = text.replace(
    /<NetworkInfo\s+network="([^"]*)"[^>]*\/>/g,
    (_m, network: string) => NETWORK_INFO[network] ?? '',
  )
  // A bare <NetworkInfo /> follows the live network toggle on the site; static
  // markdown has no toggle, so emit both networks' details.
  text = text.replace(
    /<NetworkInfo\s*\/>/g,
    `**Mainnet**\n\n${NETWORK_INFO.mainnet}\n\n**Testnet**\n\n${NETWORK_INFO.testnet}`,
  )

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

  // Remove CTA buttons with inline SVGs (e.g. "Get Started" on overview)
  text = text.replace(
    /<a\s[^>]*className="[^"]*rounded-xl[^"]*"[^>]*>[\s\S]*?<\/a>/g,
    '',
  )

  // Convert the workflow stepper to clean markdown
  text = text.replace(
    /<div\s+className="workflow-stepper[\s\S]*?Ship with confidence[\s\S]*?(?:<\/div>\s*){3}/,
    '1. **Audit** — Get your contracts reviewed\n2. **Deploy** — Deploy contracts to BattleChain\n3. **Stress Test** — Whitehats attack under Safe Harbor\n4. **Promote** — DAO approves battle-tested contracts\n5. **Mainnet** — Ship with confidence',
  )

  // Remove decorative hero banners (the content is in the page description)
  text = text.replace(
    /<div\s+className="flex items-start gap-4 mb-10 p-5 rounded-xl[\s\S]*?<\/div>\s*<\/div>/g,
    '',
  )

  // Convert the problem-panel comparison grid to clean markdown
  text = text.replace(
    /<div\s+className="mt-6 grid[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
    [
      '',
      '**Web3 Today:** Dev → Testnet → Mainnet',
      'Testnet uses fake money. Bugs are discovered *after* millions are at risk.',
      '',
      '**With BattleChain:** Dev → Testnet → BattleChain → Mainnet',
      'Real funds, controlled risk. Bugs are found *before* they matter.',
    ].join('\n'),
  )

  // Remove self-closing JSX tags (<Component /> and <br/>)
  text = text.replace(/<[A-Za-z][A-Za-z0-9.]*\b[^>]*\/>/g, '')

  // Remove opening and closing HTML/JSX tags, keep children
  text = text.replace(/<\/?[A-Za-z][A-Za-z0-9.]*\b[^>]*>/g, '')

  // Remove stray JSX expressions (style={{...}}, className="...")
  text = text.replace(/^\s*\{[^}]*\}\s*$/gm, '')

  // Convert relative markdown links to absolute URLs
  text = text.replace(
    /\]\(\/([^)]*)\)/g,
    `](${BASE_URL}/$1)`,
  )

  // Collapse runs of 3+ blank lines into 2
  text = text.replace(/\n{3,}/g, '\n\n')

  // Restore code blocks
  text = text.replace(/%%CODE(\d+)%%/g, (_, i) =>
    codeBlocks[parseInt(i, 10)],
  )

  return text.trim()
}
