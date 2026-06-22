import deployments from '@/config/deployments.generated.json'

// Network metadata and contract addresses are derived from
// config/deployments.generated.json — the merged output of the canonical
// @cyfrin/battlechain-lib addresses and the docs overlay (config/deployments.json),
// produced by scripts/build-deployments.ts. Never hardcode addresses here; to
// change an address edit the canonical lib, to change presentation edit the
// overlay, then run `pnpm build-deployments`. Values flow into every consumer
// (this config, the docs tables, the public /deployments.json endpoint, and
// llms-full.txt).

type DeployedNetwork =
  | typeof deployments.networks.testnet
  | typeof deployments.networks.mainnet

function networkConfig(net: DeployedNetwork) {
  return {
    name: net.name,
    chainId: net.chainId,
    rpcUrl: net.rpcUrl,
    explorer: net.explorer,
    currencySymbol: net.currencySymbol,
    caip2: net.caip2,
    contracts: {
      attackRegistry: net.contracts.attackRegistry.proxy,
      safeHarborRegistry: net.contracts.safeHarborRegistry.proxy,
      agreementFactory: net.contracts.agreementFactory.proxy,
      battleChainDeployer: net.contracts.battleChainDeployer.address,
      createX: net.contracts.createX.address,
    },
  }
}

export const battlechain = {
  testnet: networkConfig(deployments.networks.testnet),
  mainnet: networkConfig(deployments.networks.mainnet),
  links: deployments.links,
}
