'use client'

import { resolveActiveField, type ActiveNetwork } from '@/lib/deployments'
import { useNetwork } from '@/components/mdx/NetworkTabs'

interface NetworkValueProps {
  // A network key resolved from config/deployments.json, e.g. "rpc", "chainId",
  // "explorer", "explorerApi", "attackRegistry", "mockRegistryModerator".
  field: string
  // Override the toggle and always resolve against this network (testnet-first quickstarts).
  network?: ActiveNetwork
  href?: boolean
  label?: string
  // Appended to the value for href links. `explorer` ends in "/", so don't lead with a slash.
  path?: string
  code?: boolean
}

export function NetworkValue({ field, network, href, label, path, code = true }: NetworkValueProps) {
  const { network: active } = useNetwork()
  const value = resolveActiveField(network ?? active, field)

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
