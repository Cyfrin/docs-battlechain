import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { stripMdxToMarkdown } from '@/lib/strip-mdx'
import type { SearchDocument } from '@/lib/search'

const CONTENT_DIR = path.resolve(process.cwd(), 'content')
const INDEX_PATH = path.join(process.cwd(), 'public', 'search-index.json')
const CONFIG_PATH = path.join(process.cwd(), '.docs-config.json')

// Common English stopwords filtered out of search queries so they don't drown
// out real terms. Single-letter language names (e.g. "C") are intentionally
// kept by relying on a stopword set rather than a length filter.
const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'of', 'and', 'or', 'to', 'in', 'on',
  'for', 'with', 'as', 'at', 'by', 'i',
])

let cachedBaseUrl: string | null = null

function getBaseUrl(): string {
  if (cachedBaseUrl !== null) return cachedBaseUrl
  const docsConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
  if (typeof docsConfig.production_url !== 'string' || !docsConfig.production_url) {
    throw new Error(
      `Invalid ${CONFIG_PATH}: "production_url" must be a non-empty string.`,
    )
  }
  cachedBaseUrl = `https://${docsConfig.production_url}`
  return cachedBaseUrl
}

let cachedIndex: SearchDocument[] | null = null
let cachedIndexMtime = 0

export function loadSearchIndex(): SearchDocument[] {
  if (!fs.existsSync(INDEX_PATH)) {
    throw new Error(
      `Search index not found at ${INDEX_PATH}. Run the build to regenerate public/search-index.json.`,
    )
  }

  // Reload when the file changes so dev servers don't serve a stale index.
  const mtime = fs.statSync(INDEX_PATH).mtimeMs
  if (cachedIndex && cachedIndexMtime === mtime) {
    return cachedIndex
  }

  cachedIndex = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'))
  cachedIndexMtime = mtime
  return cachedIndex!
}

function humanizeSegment(segment: string): string {
  return segment
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function makeSnippet(content: string, tokens: string[]): string {
  const contentLower = content.toLowerCase()
  let firstMatch = -1
  for (const token of tokens) {
    const idx = contentLower.indexOf(token)
    if (idx >= 0 && (firstMatch < 0 || idx < firstMatch)) {
      firstMatch = idx
    }
  }

  if (firstMatch < 0) return content.substring(0, 200)

  const start = Math.max(0, firstMatch - 60)
  const end = Math.min(content.length, start + 200)
  return (
    (start > 0 ? '…' : '') +
    content.substring(start, end) +
    (end < content.length ? '…' : '')
  )
}

export function searchDocs(query: string) {
  const index = loadSearchIndex()
  const baseUrl = getBaseUrl()
  const tokens = query
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 0 && !STOPWORDS.has(t))

  if (tokens.length === 0) {
    throw new Error(
      'Query must contain at least one searchable word (e.g. "deploy" or "safe harbor").',
    )
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
      url: `${baseUrl}${doc.url}`,
      snippet: makeSnippet(doc.content, tokens),
    }))
}

export function readPage(pagePath: string) {
  const baseUrl = getBaseUrl()
  const normalized = pagePath
    .replace(baseUrl, '')
    .replace(/^\/+/, '')
    .replace(/\.mdx$/, '')

  // Resolve and confine to CONTENT_DIR — rejects "../" traversal attempts.
  const filePath = path.resolve(CONTENT_DIR, `${normalized}.mdx`)
  if (!filePath.startsWith(CONTENT_DIR + path.sep)) return null
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)

  const lastSegment = normalized.split('/').pop() || normalized
  return {
    title: (data.title as string) || humanizeSegment(lastSegment) || normalized,
    content: stripMdxToMarkdown(content),
  }
}

export function listPages() {
  const index = loadSearchIndex()
  const baseUrl = getBaseUrl()
  return index.map((doc) => ({
    title: doc.title,
    path: doc.url.replace(/^\//, ''),
    url: `${baseUrl}${doc.url}`,
    category: doc.category,
  }))
}
