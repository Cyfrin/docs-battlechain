'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { battlechain } from '@/config/battlechain'
import { substituteTokens } from '@/lib/network-fields'
import { useNetwork } from '@/components/mdx/NetworkTabs'

/**
 * Replace `{{token}}` placeholders inside a rendered <pre> with the active
 * network's values. Prism tokenizes code into many text nodes, and a token can
 * straddle several of them, so after a per-node pass we check the concatenated
 * text and, if any braces remain, collapse all text into the first node.
 */
function substituteInPre(pre: HTMLElement, substitute: (text: string) => string) {
  const walker = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  let node: Node | null
  while ((node = walker.nextNode())) nodes.push(node as Text)
  if (nodes.length === 0) return
  if (!/\{\{/.test(nodes.map((n) => n.data).join(''))) return

  // Per-node fast path: most tokens sit inside a single Prism token.
  for (const n of nodes) {
    if (n.data.includes('{{')) n.data = substitute(n.data)
  }

  // If a token spanned multiple nodes, braces survive — collapse into node[0].
  if (/\{\{/.test(nodes.map((n) => n.data).join(''))) {
    nodes[0].data = substitute(nodes.map((n) => n.data).join(''))
    for (let i = 1; i < nodes.length; i++) nodes[i].data = ''
  }
}

export function Pre({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const preRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)
  const { network } = useNetwork()

  // Substitute before paint so there's no flash of raw {{tokens}} or the wrong
  // network's values. Re-runs when the toggle changes.
  useLayoutEffect(() => {
    const pre = preRef.current
    if (!pre) return
    substituteInPre(pre, (text) => substituteTokens(text, battlechain[network]))
  }, [network, children])

  const handleCopy = async () => {
    // textContent reflects the already-substituted DOM, so copy is correct.
    const text = preRef.current?.textContent ?? ''
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      <pre ref={preRef} {...props} suppressHydrationWarning>
        {children}
      </pre>
      <button
        onClick={handleCopy}
        aria-label="Copy code"
        className="absolute top-3 right-3 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800/60 hover:bg-gray-700/80 text-gray-400 hover:text-gray-200"
      >
        {copied
          ? <Check className="w-4 h-4 text-green-400" />
          : <Copy className="w-4 h-4" />
        }
      </button>
    </div>
  )
}
