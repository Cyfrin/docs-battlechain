import { battlechain } from '@/config/battlechain'

export type NetworkConfig =
  | typeof battlechain.testnet
  | typeof battlechain.mainnet

/**
 * Common tokens that may omit the `contracts.` prefix. Keeps content terse:
 * `{{attackRegistryProxy}}` resolves the same as `{{contracts.attackRegistryProxy}}`.
 */
export const FIELD_ALIASES: Record<string, string> = {
  createX: 'contracts.createX',
  registryImplementation: 'contracts.registryImplementation',
  registryProxy: 'contracts.registryProxy',
  agreementFactoryImplementation: 'contracts.agreementFactoryImplementation',
  agreementFactoryProxy: 'contracts.agreementFactoryProxy',
  attackRegistryImplementation: 'contracts.attackRegistryImplementation',
  attackRegistryProxy: 'contracts.attackRegistryProxy',
  battleChainDeployer: 'contracts.battleChainDeployer',
  registryModerator: 'contracts.registryModerator',
}

/**
 * Resolve a dotted-path field (e.g. `rpcUrl`, `contracts.attackRegistryProxy`)
 * against a network config. Aliases let common contract fields skip the
 * `contracts.` prefix. Returns '' for missing keys (e.g. mainnet has no
 * registryModerator) so callers can render nothing rather than `undefined`.
 */
export function resolveField(net: NetworkConfig, token: string): string {
  const path = FIELD_ALIASES[token] ?? token
  let value: unknown = net
  for (const key of path.split('.')) {
    if (value == null || typeof value !== 'object') return ''
    value = (value as Record<string, unknown>)[key]
  }
  return value == null ? '' : String(value)
}

const TOKEN_RE = /\{\{\s*([\w.]+)\s*\}\}/g

/** Replace every `{{token}}` in `text` with its resolved value for `net`. */
export function substituteTokens(text: string, net: NetworkConfig): string {
  return text.replace(TOKEN_RE, (_match, token: string) => resolveField(net, token))
}
