'use client'

import { battlechain } from '@/config/battlechain'
import { resolveField } from '@/lib/network-fields'
import { useNetwork, type NetworkId } from '@/components/mdx/NetworkTabs'

interface NetworkValueProps {
  // Dotted-path field into the network config, e.g. "rpcUrl", "contracts.attackRegistryProxy".
  field: string
  // Override the toggle and always resolve against this network (testnet-first quickstarts).
  network?: NetworkId
  href?: boolean
  label?: string
  // Appended to the value for href links. `explorer` ends in "/", so don't lead with a slash.
  path?: string
  code?: boolean
}

export function NetworkValue({ field, network, href, label, path, code = true }: NetworkValueProps) {
  const { network: active } = useNetwork()
  const value = resolveField(battlechain[network ?? active], field)

  if (href) {
    const url = path ? `${value}${path}` : value
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#004DFF] hover:underline break-all"
        suppressHydrationWarning
      >
        {label ?? url}
      </a>
    )
  }

  if (code) {
    return (
      <code suppressHydrationWarning className="break-all">
        {value}
      </code>
    )
  }

  return <span suppressHydrationWarning>{value}</span>
}
