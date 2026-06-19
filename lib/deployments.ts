import deployments from '../config/deployments.json'
import mockContracts from '../config/mock-contracts.json'

// Single source of truth for BattleChain addresses and network metadata.
// `substituteDeploymentTokens` replaces `%%token%%` placeholders in MDX content
// with real values at build/render time, so docs never hardcode an address.
//
// Token grammar:
//   %%<network>.<key>%%   — e.g. %%testnet.attackRegistry%%, %%mainnet.rpc%%
//   %%active.<key>%%      — follows the live Mainnet/Testnet toggle, resolved
//                           client-side (see substituteActiveTokens); the
//                           build-time pass leaves these untouched
//   %%<linkKey>%%         — e.g. %%bridge%%, %%faucet%%
//
// network: testnet | mainnet | sepolia
// network keys: rpc, explorer, explorerApi, chainId, caip2, name, currency,
//   any contract name (attackRegistry, safeHarborRegistry, agreementFactory,
//   battleChainDeployer, createX, mockRegistryModerator, bridgehub, zkChain,
//   chainTypeManager, validatorTimelock), or governance role (owner,
//   registryModerator, treasury).

export { deployments }

interface ContractEntry {
  proxy?: string
  implementation?: string
  address?: string
}

interface NetworkShape {
  name: string
  chainId: number
  caip2: string
  rpcUrl?: string
  explorer?: string
  explorerApi?: string
  currencySymbol?: string
  contracts: Record<string, ContractEntry>
  governance?: Record<string, string>
}

const networks = deployments.networks as Record<string, NetworkShape>
const links = deployments.links as Record<string, string>

function resolveNetworkToken(net: NetworkShape, key: string): string | undefined {
  const meta: Record<string, string | undefined> = {
    rpc: net.rpcUrl,
    explorer: net.explorer,
    explorerApi: net.explorerApi,
    chainId: String(net.chainId),
    caip2: net.caip2,
    name: net.name,
    currency: net.currencySymbol,
  }
  if (key in meta) return meta[key]

  // A contract key, optionally with a `.proxy` / `.implementation` / `.address`
  // suffix. Bare key defaults to the interaction address (proxy ?? address).
  const dot = key.indexOf('.')
  const contractName = dot === -1 ? key : key.slice(0, dot)
  const part = dot === -1 ? undefined : key.slice(dot + 1)
  const contract = net.contracts[contractName]
  if (contract) {
    if (part === 'implementation') return contract.implementation
    if (part === 'proxy') return contract.proxy
    if (part === 'address') return contract.address
    return contract.proxy ?? contract.address
  }

  return net.governance?.[key]
}

// Walk a dotted path (e.g. "tokens.weth") into config/mock-contracts.json.
// Leaf may be a string address or a { address, ... } object.
function resolveMockToken(path: string): string | undefined {
  let node: unknown = mockContracts
  for (const seg of path.split('.')) {
    if (node == null || typeof node !== 'object') return undefined
    node = (node as Record<string, unknown>)[seg]
  }
  if (typeof node === 'string') return node
  if (node && typeof node === 'object') {
    const addr = (node as { address?: unknown }).address
    if (typeof addr === 'string') return addr
  }
  return undefined
}

export function resolveDeploymentToken(token: string): string | undefined {
  const dot = token.indexOf('.')
  if (dot === -1) return links[token]

  const scope = token.slice(0, dot)
  const rest = token.slice(dot + 1)
  if (scope === 'mock') return resolveMockToken(rest)

  const net = networks[scope]
  if (!net) return undefined
  return resolveNetworkToken(net, rest)
}

const TOKEN_RE = /%%([A-Za-z0-9_.]+)%%/g

/**
 * Replace `%%token%%` placeholders with values from config/deployments.json.
 * Idempotent — resolved values contain no tokens. Throws on an unknown token
 * so typos fail the build instead of silently shipping a placeholder.
 *
 * `%%active.*%%` tokens are intentionally left in place: they follow the live
 * Mainnet/Testnet toggle and are resolved client-side via substituteActiveTokens.
 */
export function substituteDeploymentTokens(raw: string): string {
  return raw.replace(TOKEN_RE, (full, token: string) => {
    if (token.startsWith('active.')) return full
    const value = resolveDeploymentToken(token)
    if (value === undefined) {
      throw new Error(
        `Unknown deployment token "${full}" — not found in config/deployments.json.`,
      )
    }
    return value
  })
}

export type ActiveNetwork = 'testnet' | 'mainnet'

/**
 * Resolve `%%active.<key>%%` tokens against `network` — the live toggle value.
 * Used by client components (Pre, NetworkValue) so a single doc block reflects
 * whichever network the reader has selected. Unknown `active.*` keys resolve to
 * '' (e.g. mainnet has no mockRegistryModerator) so callers render nothing
 * rather than a stray placeholder. Non-active tokens are left untouched.
 */
export function substituteActiveTokens(raw: string, network: ActiveNetwork): string {
  const net = networks[network]
  if (!net) return raw
  return raw.replace(TOKEN_RE, (full, token: string) => {
    if (!token.startsWith('active.')) return full
    return resolveNetworkToken(net, token.slice('active.'.length)) ?? ''
  })
}

/** Resolve a single `active.<key>` field for `network` (for NetworkValue). */
export function resolveActiveField(network: ActiveNetwork, key: string): string {
  const net = networks[network]
  if (!net) return ''
  return resolveNetworkToken(net, key) ?? ''
}
