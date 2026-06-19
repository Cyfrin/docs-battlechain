import { Download } from 'lucide-react'

interface InstallButtonProps {
  // Hosted as a GitHub release asset on Cyfrin/docs-battlechain. To publish a new
  // bundle: rebuild `battlechain.mcpb` in the battlechain-mcp-node project, then
  // `gh release upload mcpb-v1.0.0 battlechain.mcpb --clobber` (or cut a new tag
  // and bump the href below). See MCPB_HOSTING.md.
  href?: string
  label?: string
  sublabel?: string
}

export function InstallButton({
  href = 'https://github.com/Cyfrin/docs-battlechain/releases/download/mcpb-v1.0.0/battlechain.mcpb',
  label = 'Download the BattleChain extension',
  sublabel = 'Opens in Claude Desktop — one-click install, no terminal',
}: InstallButtonProps) {
  return (
    <a
      href={href}
      download
      className="not-prose group my-5 inline-flex items-center gap-3 rounded-xl px-5 py-3.5 font-semibold text-white no-underline shadow-sm transition-transform hover:-translate-y-0.5"
      style={{ background: '#004DFF' }}
    >
      <Download className="h-5 w-5 shrink-0" />
      <span className="flex flex-col leading-tight">
        <span>{label}</span>
        <span className="text-xs font-normal text-white/80">{sublabel}</span>
      </span>
    </a>
  )
}

export default InstallButton
