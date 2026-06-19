'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { substituteActiveTokens } from '@/lib/deployments'
import { useNetwork } from '@/components/mdx/NetworkTabs'

/**
 * Replace `%%active.*%%` placeholders inside a rendered <pre> with the active
 * network's values. Prism tokenizes code into many text nodes, and a token can
 * straddle several of them, so after a per-node pass we check the concatenated
 * text and, if any markers remain, collapse all text into the first node.
 * (Build-time substitution has already resolved %%testnet.*%% / %%mainnet.*%%;
 * only %%active.*%% reaches the client.)
 */
function substituteInPre(pre: HTMLElement, substitute: (text: string) => string) {
  const walker = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  let node: Node | null
  while ((node = walker.nextNode())) nodes.push(node as Text)
  if (nodes.length === 0) return
  if (!nodes.map((n) => n.data).join('').includes('%%active.')) return

  // Per-node fast path: most tokens sit inside a single Prism token.
  for (const n of nodes) {
    if (n.data.includes('%%active.')) n.data = substitute(n.data)
  }

  // If a token spanned multiple nodes, markers survive — collapse into node[0].
  if (nodes.map((n) => n.data).join('').includes('%%active.')) {
    nodes[0].data = substitute(nodes.map((n) => n.data).join(''))
    for (let i = 1; i < nodes.length; i++) nodes[i].data = ''
  }
}

export function Pre({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const preRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)
  const { network } = useNetwork()

  // Substitute before paint so there's no flash of raw %%active%% tokens or the
  // wrong network's values. Substitution mutates the DOM destructively (the
  // %%active%% markers are gone afterwards), so the `key={network}` on <pre>
  // remounts it on every toggle — restoring the original tokenized children so
  // this effect can re-substitute for the newly selected network.
  useLayoutEffect(() => {
    const pre = preRef.current
    if (!pre) return
    substituteInPre(pre, (text) => substituteActiveTokens(text, network))
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
      <pre key={network} ref={preRef} {...props} suppressHydrationWarning>
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
