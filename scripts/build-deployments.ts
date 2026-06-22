import fs from 'fs'
import path from 'path'

import canonical from '@cyfrin/battlechain-lib/deployments.json'

/**
 * Single-source-of-truth build step for BattleChain deployments.
 *
 * Contract ADDRESSES come from @cyfrin/battlechain-lib/deployments.json (the
 * canonical source generated from the Solidity sources). config/deployments.json
 * is a docs-owned presentation OVERLAY: it supplies links, network metadata
 * (rpc/explorer/labels), the field-mapping rules that project canonical
 * addresses onto the docs' proxy/implementation structure, and docs-only
 * networks/roles the canonical lib does not provide (e.g. L1 settlement layers).
 *
 * This script merges the two, validates the result, then emits the derived
 * artifacts:
 *   1. public/deployments.json — the public, machine-readable endpoint
 *      (https://docs.battlechain.com/deployments.json).
 *   2. config/deployments.generated.json — the merged, address-resolved data
 *      that the runtime consumers (lib/deployments.ts, config/battlechain.ts)
 *      import. Regenerated here so runtime never reads the overlay directly.
 *   3. The address tables inside content/battlechain/reference/contracts.mdx,
 *      regenerated between the `deployments:start`/`deployments:end` markers so
 *      the human docs and llms-full.txt never drift from the JSON.
 */

const ROOT = process.cwd()
const OVERLAY_SOURCE = path.join(ROOT, 'config', 'deployments.json')
const PUBLIC_OUT = path.join(ROOT, 'public', 'deployments.json')
const GENERATED_OUT = path.join(ROOT, 'config', 'deployments.generated.json')
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

interface CanonicalNetwork {
  chainId: number
  caip2: string
  [field: string]: string | number
}

interface Canonical {
  networks: Record<string, CanonicalNetwork>
}

// Overlay shapes — addresses are never literal here; they reference a canonical
// field via *From keys, except docs-only networks (no canonicalChainId) which
// carry literal addresses the canonical lib does not provide.
interface OverlayContract {
  proxyFrom?: string
  implementationFrom?: string
  addressFrom?: string
  proxy?: string
  implementation?: string
  address?: string
}

type OverlayGovernanceValue = string | { addressFrom: string }

interface OverlayNetwork {
  name: string
  canonicalChainId?: number
  chainId: number
  caip2: string
  rpcUrl?: string
  explorer?: string
  explorerApi?: string
  currencySymbol?: string
  isTestnet?: boolean
  settlementLayer?: string
  role?: string
  contracts: Record<string, OverlayContract>
  governance?: Record<string, OverlayGovernanceValue>
}

interface Overlay {
  links: Record<string, string>
  networks: Record<string, OverlayNetwork>
}

// Resolved (merged) shapes — what runtime + public artifacts consume.
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
  explorerApi?: string
  currencySymbol?: string
  isTestnet?: boolean
  settlementLayer?: string
  role?: string
  contracts: Record<string, ContractEntry>
  governance?: Record<string, string>
}

interface Deployments {
  links: Record<string, string>
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

const canonicalData = canonical as unknown as Canonical

function canonicalField(chainId: number, field: string, where: string): string {
  const net = canonicalData.networks[String(chainId)]
  if (!net) {
    fail(`overlay references canonical chainId ${chainId} (${where}) but it is not in @cyfrin/battlechain-lib/deployments.json`)
  }
  const value = net[field]
  if (typeof value !== 'string') {
    fail(`canonical chainId ${chainId} is missing string field "${field}" (needed by ${where})`)
  }
  return value
}

function resolveContracts(
  net: OverlayNetwork,
  netKey: string,
): Record<string, ContractEntry> {
  const out: Record<string, ContractEntry> = {}
  for (const [name, entry] of Object.entries(net.contracts)) {
    const where = `${netKey}.contracts.${name}`
    if (net.canonicalChainId === undefined) {
      // Docs-only network: addresses are literal in the overlay.
      out[name] = { proxy: entry.proxy, implementation: entry.implementation, address: entry.address }
      continue
    }
    const resolved: ContractEntry = {}
    if (entry.proxyFrom) resolved.proxy = canonicalField(net.canonicalChainId, entry.proxyFrom, `${where}.proxy`)
    if (entry.implementationFrom)
      resolved.implementation = canonicalField(net.canonicalChainId, entry.implementationFrom, `${where}.implementation`)
    if (entry.addressFrom) resolved.address = canonicalField(net.canonicalChainId, entry.addressFrom, `${where}.address`)
    out[name] = resolved
  }
  return out
}

function resolveGovernance(
  net: OverlayNetwork,
  netKey: string,
): Record<string, string> | undefined {
  if (!net.governance) return undefined
  const out: Record<string, string> = {}
  for (const [role, value] of Object.entries(net.governance)) {
    if (typeof value === 'string') {
      out[role] = value
    } else {
      out[role] = canonicalField(net.canonicalChainId!, value.addressFrom, `${netKey}.governance.${role}`)
    }
  }
  return out
}

function merge(overlay: Overlay): Deployments {
  const networks: Record<string, Network> = {}
  for (const [netKey, net] of Object.entries(overlay.networks)) {
    networks[netKey] = {
      name: net.name,
      chainId: net.chainId,
      caip2: net.caip2,
      ...(net.rpcUrl !== undefined ? { rpcUrl: net.rpcUrl } : {}),
      ...(net.explorer !== undefined ? { explorer: net.explorer } : {}),
      ...(net.explorerApi !== undefined ? { explorerApi: net.explorerApi } : {}),
      ...(net.currencySymbol !== undefined ? { currencySymbol: net.currencySymbol } : {}),
      ...(net.isTestnet !== undefined ? { isTestnet: net.isTestnet } : {}),
      ...(net.settlementLayer !== undefined ? { settlementLayer: net.settlementLayer } : {}),
      ...(net.role !== undefined ? { role: net.role } : {}),
      contracts: resolveContracts(net, netKey),
      ...((): { governance?: Record<string, string> } => {
        const g = resolveGovernance(net, netKey)
        return g ? { governance: g } : {}
      })(),
    }
  }
  return { links: overlay.links, networks }
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
  '{/* deployments:start — generated from config/deployments.json + @cyfrin/battlechain-lib by scripts/build-deployments.ts. Do not edit by hand. */}'
const END_MARKER = '{/* deployments:end */}'
const BLOCK_RE = /\{\/\* deployments:start[\s\S]*?deployments:end \*\/\}/

const code = (addr?: string): string => (addr ? `\`${addr}\`` : '—')

function coreTable(testnet: Network, mainnet: Network): string {
  const rows: [string, ContractEntry, ContractEntry][] = [
    ['AttackRegistry (proxy)', testnet.contracts.attackRegistry, mainnet.contracts.attackRegistry],
    ['SafeHarborRegistry (proxy)', testnet.contracts.safeHarborRegistry, mainnet.contracts.safeHarborRegistry],
    ['AgreementFactory (proxy)', testnet.contracts.agreementFactory, mainnet.contracts.agreementFactory],
    ['BattleChainDeployer', testnet.contracts.battleChainDeployer, mainnet.contracts.battleChainDeployer],
    ['CreateX', testnet.contracts.createX, mainnet.contracts.createX],
  ]
  return [
    '| Contract | Testnet | Mainnet |',
    '|----------|---------|---------|',
    ...rows.map(
      ([label, t, m]) =>
        `| ${label} | ${code(t.proxy ?? t.address)} | ${code(m.proxy ?? m.address)} |`,
    ),
  ].join('\n')
}

function implementationsTable(testnet: Network, mainnet: Network): string {
  const rows: [string, ContractEntry, ContractEntry][] = [
    ['AttackRegistry', testnet.contracts.attackRegistry, mainnet.contracts.attackRegistry],
    ['SafeHarborRegistry', testnet.contracts.safeHarborRegistry, mainnet.contracts.safeHarborRegistry],
    ['AgreementFactory', testnet.contracts.agreementFactory, mainnet.contracts.agreementFactory],
  ]
  return [
    '| Contract | Testnet | Mainnet |',
    '|----------|---------|---------|',
    ...rows.map(
      ([label, t, m]) => `| ${label} | ${code(t.implementation)} | ${code(m.implementation)} |`,
    ),
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

function l1Table(net: Network, zkChainLabel: string): string {
  const c = net.contracts
  const rows: [string, ContractEntry | undefined][] = [
    ['Bridgehub', c.bridgehub],
    [zkChainLabel, c.zkChain],
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
  const { testnet, mainnet, sepolia, ethereum } = data.networks
  const moderator = testnet.contracts.mockRegistryModerator?.address

  return [
    START_MARKER,
    '',
    '## Deployed Addresses',
    '',
    '<Note>',
    'Every address on this page comes from a single source of truth and is served as JSON at [`/deployments.json`](https://docs.battlechain.com/deployments.json). Fetch that file from scripts or AI agents instead of scraping these tables.',
    '</Note>',
    '',
    'The **proxy** is the address you interact with. Implementation and Sepolia L1 addresses follow below.',
    '',
    coreTable(testnet, mainnet),
    '',
    moderator
      ? `**Testnet only** — \`MockRegistryModerator\` at ${code(moderator)}. This permissionless contract lets you approve your own attack request instantly on testnet; mainnet uses the DAO multisig below.`
      : '',
    '',
    'For mock Chainlink price feeds and test tokens (testnet only), see [Mock Contracts](/battlechain/reference/mock-contracts).',
    '',
    '### Implementation addresses',
    '',
    'The current UUPS implementations behind the proxies above:',
    '',
    implementationsTable(testnet, mainnet),
    '',
    '### Mainnet governance',
    '',
    governanceTable(mainnet),
    '',
    '### Sepolia (Testnet L1)',
    '',
    sepolia.role ?? '',
    '',
    l1Table(sepolia, 'ZK Chain (627)'),
    '',
    ...(ethereum
      ? [
          '### Ethereum (Mainnet L1)',
          '',
          ethereum.role ?? '',
          '',
          l1Table(ethereum, 'ZK Chain (626)'),
          '',
        ]
      : []),
    END_MARKER,
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
}

// ── Main ──────────────────────────────────────────────────────────

const overlay: Overlay = JSON.parse(fs.readFileSync(OVERLAY_SOURCE, 'utf-8'))
const data = merge(overlay)
validate(data)

fs.writeFileSync(PUBLIC_OUT, JSON.stringify(data, null, 2) + '\n')
fs.writeFileSync(GENERATED_OUT, JSON.stringify(data, null, 2) + '\n')

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
console.log(`✓ Merged canonical @cyfrin/battlechain-lib addresses with docs overlay`)
console.log(`✓ Wrote public/deployments.json (${networkCount} networks)`)
console.log('✓ Wrote config/deployments.generated.json')
console.log('✓ Regenerated address tables in content/battlechain/reference/contracts.mdx')
console.log('✓ Wrote public/mock-contracts.json')
