import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { stripMdxToMarkdown } from '@/lib/strip-mdx'
import type { SearchDocument } from '@/lib/search'

const CONTENT_DIR = path.join(process.cwd(), 'content')
const BASE_URL = 'https://docs.battlechain.com'

// ── Search index (cached across hot requests) ──────────────────

let cachedIndex: SearchDocument[] | null = null

function loadSearchIndex(): SearchDocument[] {
  if (cachedIndex) return cachedIndex

  const indexPath = path.join(process.cwd(), 'public', 'search-index.json')
  if (!fs.existsSync(indexPath)) return []

  cachedIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
  return cachedIndex!
}

// ── Tool implementations ───────────────────────────────────────

function searchDocs(query: string) {
  const index = loadSearchIndex()
  const tokens = query
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 1)

  if (tokens.length === 0) {
    return index.slice(0, 5).map((doc) => ({
      title: doc.title,
      url: `${BASE_URL}${doc.url}`,
      snippet: doc.content.substring(0, 200),
    }))
  }

  return index
    .map((doc) => {
      let score = 0
      const titleLower = doc.title.toLowerCase()
      const contentLower = doc.content.toLowerCase()

      for (const token of tokens) {
        if (titleLower.includes(token)) score += 3
        for (const heading of doc.headings) {
          if (heading.toLowerCase().includes(token)) {
            score += 2
            break
          }
        }
        if (contentLower.includes(token)) score += 1
      }

      return { doc, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ doc }) => ({
      title: doc.title,
      url: `${BASE_URL}${doc.url}`,
      snippet: doc.content.substring(0, 200),
    }))
}

function readPage(pagePath: string) {
  const normalized = pagePath
    .replace(BASE_URL, '')
    .replace(/^\/+/, '')
    .replace(/\.mdx$/, '')

  const filePath = path.join(CONTENT_DIR, `${normalized}.mdx`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)

  return {
    title: (data.title as string) || normalized,
    content: stripMdxToMarkdown(content),
  }
}

function listPages() {
  const index = loadSearchIndex()
  return index.map((doc) => ({
    title: doc.title,
    path: doc.url.replace(/^\//, ''),
    url: `${BASE_URL}${doc.url}`,
    category: doc.category,
  }))
}

// ── MCP server factory ─────────────────────────────────────────

function createServer(): McpServer {
  const server = new McpServer({
    name: 'battlechain-docs',
    version: '1.0.0',
  })

  server.tool(
    'search_docs',
    'Search BattleChain documentation by keyword or topic. Returns matching pages with snippets.',
    { query: z.string().describe('Search query (e.g. "safe harbor", "deploy contract")') },
    async ({ query }) => ({
      content: [{ type: 'text' as const, text: JSON.stringify(searchDocs(query), null, 2) }],
    }),
  )

  server.tool(
    'read_page',
    'Read the full content of a specific BattleChain documentation page as clean markdown.',
    {
      path: z
        .string()
        .describe('Page path, e.g. "battlechain/quickstart/deploy-your-contract" or a full URL'),
    },
    async ({ path: pagePath }) => {
      const page = readPage(pagePath)
      if (!page) {
        return {
          content: [{ type: 'text' as const, text: `Page not found: ${pagePath}` }],
          isError: true,
        }
      }
      return {
        content: [{ type: 'text' as const, text: `# ${page.title}\n\n${page.content}` }],
      }
    },
  )

  server.tool(
    'list_pages',
    'List all available BattleChain documentation pages with their paths and categories.',
    async () => ({
      content: [{ type: 'text' as const, text: JSON.stringify(listPages(), null, 2) }],
    }),
  )

  return server
}

// ── Route handler ──────────────────────────────────────────────

async function handleMcpRequest(request: Request): Promise<Response> {
  const server = createServer()
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })

  await server.connect(transport)

  try {
    return await transport.handleRequest(request)
  } finally {
    await transport.close()
    await server.close()
  }
}

export async function GET(request: Request) {
  return handleMcpRequest(request)
}

export async function POST(request: Request) {
  return handleMcpRequest(request)
}

export async function DELETE(request: Request) {
  return handleMcpRequest(request)
}
