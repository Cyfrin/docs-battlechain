import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { z } from 'zod'
import { listPages, readPage, searchDocs } from '@/lib/mcp-tools'

function toErrorResult(err: unknown) {
  return {
    content: [
      { type: 'text' as const, text: err instanceof Error ? err.message : String(err) },
    ],
    isError: true,
  }
}

function createServer(): McpServer {
  const server = new McpServer({
    name: 'battlechain-docs',
    version: '1.0.0',
  })

  server.registerTool(
    'search_docs',
    {
      description:
        'Search BattleChain documentation by keyword or topic. Returns matching pages with snippets.',
      inputSchema: {
        query: z.string().describe('Search query (e.g. "safe harbor", "deploy contract")'),
      },
    },
    async ({ query }) => {
      try {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(searchDocs(query), null, 2) }],
        }
      } catch (err) {
        return toErrorResult(err)
      }
    },
  )

  server.registerTool(
    'read_page',
    {
      description: 'Read the full content of a specific BattleChain documentation page as clean markdown.',
      inputSchema: {
        path: z
          .string()
          .describe('Page path, e.g. "battlechain/quickstart/deploy-your-contract" or a full URL'),
      },
    },
    async ({ path: pagePath }) => {
      try {
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
      } catch (err) {
        return toErrorResult(err)
      }
    },
  )

  server.registerTool(
    'list_pages',
    {
      description: 'List all available BattleChain documentation pages with their paths and categories.',
    },
    async () => {
      try {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(listPages(), null, 2) }],
        }
      } catch (err) {
        return toErrorResult(err)
      }
    },
  )

  return server
}

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
    // allSettled so one cleanup failure can't orphan the other resource.
    await Promise.allSettled([transport.close(), server.close()])
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
