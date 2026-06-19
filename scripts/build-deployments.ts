import fs from 'fs'
import path from 'path'

/**
 * Single-source-of-truth build step for BattleChain deployments.
 *
 * Reads config/deployments.json (the only place addresses are maintained),
 * validates it, then emits two derived artifacts:
 *   1. public/deployments.json — the public, machine-readable endpoint
 *      (https://docs.battlechain.com/deployments.json).
 *   2. The address tables inside content/battlechain/reference/contracts.mdx,
 *      regenerated between the `deployments:start`/`deployments:end` markers so
 *      the human docs and llms-full.txt never drift from the JSON.
 */

const ROOT = process.cwd()
const SOURCE = path.join(ROOT, 'config', 'deployments.json')
const PUBLIC_OUT = path.join(ROOT, 'public', 'deployments.json')
const CONTRACTS_MDX = path.join(
  ROOT,
  'content',
  'battlechain',
  'reference',
  'contracts.mdx',
)
const MOCK_SOURCE = path.join(ROOT, 'config', 'mock-contracts.json')
const MOCK_PUBLIC_OUT = path.join(ROOT, 'public', 'mock-contracts.json')

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/
const ID_RE = /^0x[0-9a-fA-F]{64}$/

interface ContractEntry {
  proxy?: string
  implementation?: string
  address?: string
}

interface Network {
  name: string
  chainId: number
  caip2: string
  rpcUrl?: string
  explorer?: string
  role?: string
  contracts: Record<string, ContractEntry>
  governance?: Record<string, string>
}

interface Deployments {
  networks: Record<string, Network>
}

function fail(message: string): never {
  throw new Error(`build-deployments: ${message}`)
}

function assertAddress(value: string, where: string): void {
  if (!ADDRESS_RE.test(value)) {
    fail(`invalid address at ${where}: "${value}" (expected 0x + 40 hex chars)`)
  }
}

function validate(data: Deployments): void {
  if (!data.networks || typeof data.networks !== 'object') {
    fail('missing "networks" object')
  }
  for (const [netKey, net] of Object.entries(data.networks)) {
    if (typeof net.chainId !== 'number') {
      fail(`network "${netKey}" is missing a numeric chainId`)
    }
    for (const [name, entry] of Object.entries(net.contracts)) {
      const addresses = [entry.proxy, entry.implementation, entry.address].filter(
        (a): a is string => typeof a === 'string',
      )
      if (addresses.length === 0) {
        fail(`contract "${netKey}.${name}" has no address/proxy/implementation`)
      }
      for (const addr of addresses) {
        assertAddress(addr, `${netKey}.${name}`)
      }
    }
    for (const [role, addr] of Object.entries(net.governance ?? {})) {
      assertAddress(addr, `${netKey}.governance.${role}`)
    }
  }
}

const START_MARKER =
  '{/* deployments:start — generated from config/deployments.json by scripts/build-deployments.ts. Do not edit by hand. */}'
const END_MARKER = '{/* deployments:end */}'
const BLOCK_RE = /\{\/\* deployments:start[\s\S]*?deployments:end \*\/\}/

const code = (addr?: string): string => (addr ? `\`${addr}\`` : '—')

// A table cell that follows the live Mainnet/Testnet toggle. <NetworkValue>
// resolves `field` against the selected network's deployments entry at render
// time (and degrades to mainnet in static llms.txt / search output).
const nv = (field: string): string => `<NetworkValue field="${field}" />`

function coreTable(): string {
  const rows: [string, string][] = [
    ['AttackRegistry (proxy)', 'attackRegistry'],
    ['SafeHarborRegistry (proxy)', 'safeHarborRegistry'],
    ['AgreementFactory (proxy)', 'agreementFactory'],
    ['BattleChainDeployer', 'battleChainDeployer'],
    ['CreateX', 'createX'],
  ]
  return [
    '| Contract | Address |',
    '|----------|---------|',
    ...rows.map(([label, field]) => `| ${label} | ${nv(field)} |`),
  ].join('\n')
}

function implementationsTable(): string {
  const rows: [string, string][] = [
    ['AttackRegistry', 'attackRegistry.implementation'],
    ['SafeHarborRegistry', 'safeHarborRegistry.implementation'],
    ['AgreementFactory', 'agreementFactory.implementation'],
  ]
  return [
    '| Contract | Address |',
    '|----------|---------|',
    ...rows.map(([label, field]) => `| ${label} | ${nv(field)} |`),
  ].join('\n')
}

function governanceTable(mainnet: Network): string {
  const g = mainnet.governance ?? {}
  const rows: [string, string | undefined][] = [
    ['Owner (Safe)', g.owner],
    ['Registry moderator (Safe)', g.registryModerator],
    ['Treasury (Safe)', g.treasury],
  ]
  return [
    '| Role | Address |',
    '|------|---------|',
    ...rows.map(([label, addr]) => `| ${label} | ${code(addr)} |`),
  ].join('\n')
}

function sepoliaTable(sepolia: Network): string {
  const c = sepolia.contracts
  const rows: [string, ContractEntry | undefined][] = [
    ['Bridgehub', c.bridgehub],
    ['ZK Chain (627)', c.zkChain],
    ['Chain Type Manager', c.chainTypeManager],
    ['Validator Timelock', c.validatorTimelock],
  ]
  return [
    '| Contract | Address |',
    '|----------|---------|',
    ...rows.map(([label, entry]) => `| ${label} | ${code(entry?.address)} |`),
  ].join('\n')
}

function generateBlock(data: Deployments): string {
  const { mainnet, sepolia } = data.networks

  return [
    START_MARKER,
    '',
    '## Deployed Addresses',
    '',
    'Use the **Mainnet / Testnet** toggle in the top bar to choose which network these addresses are for — the tables below show the selected network.',
    '',
    '<Note>',
    'Every address comes from a single source of truth and is served as JSON at [`/deployments.json`](https://docs.battlechain.com/deployments.json) (with **both** networks). Fetch that file from scripts or AI agents instead of scraping these tables.',
    '</Note>',
    '',
    'The **proxy** is the address you interact with. Implementation and L1 addresses follow below.',
    '',
    coreTable(),
    '',
    // Testnet-only: the permissionless instant-approval moderator.
    '<Network title="Testnet">',
    '',
    '**Testnet only** — `MockRegistryModerator` at <NetworkValue field="mockRegistryModerator" />. This permissionless contract lets you approve your own attack request instantly on testnet; mainnet uses the DAO multisig.',
    '',
    '</Network>',
    '',
    'For mock Chainlink price feeds and test tokens (testnet only), see [Mock Contracts](/battlechain/reference/mock-contracts).',
    '',
    '### Implementation addresses',
    '',
    'The current UUPS implementations behind the proxies above:',
    '',
    implementationsTable(),
    '',
    // Mainnet-only governance roles.
    '<Network title="Mainnet">',
    '',
    '### Governance',
    '',
    governanceTable(mainnet),
    '',
    '</Network>',
    '',
    // Sepolia is the L1 settlement layer for the testnet only.
    '<Network title="Testnet">',
    '',
    '### Sepolia (Testnet L1)',
    '',
    sepolia.role ?? '',
    '',
    sepoliaTable(sepolia),
    '',
    '</Network>',
    '',
    END_MARKER,
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
}

// ── Main ──────────────────────────────────────────────────────────

const raw = fs.readFileSync(SOURCE, 'utf-8')
const data: Deployments = JSON.parse(raw)
validate(data)

fs.writeFileSync(PUBLIC_OUT, JSON.stringify(data, null, 2) + '\n')

const mdx = fs.readFileSync(CONTRACTS_MDX, 'utf-8')
if (!BLOCK_RE.test(mdx)) {
  fail(
    `markers not found in ${path.relative(ROOT, CONTRACTS_MDX)}. ` +
      `Expected a block delimited by "${START_MARKER}" and "${END_MARKER}".`,
  )
}
const updated = mdx.replace(BLOCK_RE, generateBlock(data))
fs.writeFileSync(CONTRACTS_MDX, updated)

// ── Mock / dependency contracts ─────────────────────────────────────
// Every string leaf must be a valid address or 32-byte id; null = pending.
function validateMocks(node: unknown, where: string): void {
  if (node === null) return
  if (typeof node === 'string') {
    if (!ADDRESS_RE.test(node) && !ID_RE.test(node)) {
      fail(`invalid mock value at ${where}: "${node}" (expected 0x + 40 or 64 hex chars)`)
    }
    return
  }
  if (typeof node === 'number') return
  if (typeof node === 'object') {
    // A contract entry with an `address` is a leaf — validate the address,
    // ignore sibling metadata (symbol, decimals).
    const addr = (node as { address?: unknown }).address
    if (typeof addr === 'string' || addr === null) {
      validateMocks(addr, `${where}.address`)
      return
    }
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('_')) continue
      validateMocks(v, `${where}.${k}`)
    }
  }
}

const mock = JSON.parse(fs.readFileSync(MOCK_SOURCE, 'utf-8'))
validateMocks(mock, 'mock')
fs.writeFileSync(MOCK_PUBLIC_OUT, JSON.stringify(mock, null, 2) + '\n')

const networkCount = Object.keys(data.networks).length
console.log(`✓ Wrote public/deployments.json (${networkCount} networks)`)
console.log('✓ Regenerated address tables in content/battlechain/reference/contracts.mdx')
console.log('✓ Wrote public/mock-contracts.json')
