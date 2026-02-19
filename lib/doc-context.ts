import fs from 'fs'
import path from 'path'
import type { SearchDocument } from '@/lib/search'

const TOP_N = 8
const MAX_CONTENT_LENGTH = 500
const TITLE_WEIGHT = 3
const HEADING_WEIGHT = 2
const CONTENT_WEIGHT = 1

let cachedIndex: SearchDocument[] | null = null

function loadIndex(): SearchDocument[] {
  if (cachedIndex) return cachedIndex

  const indexPath = path.join(
    process.cwd(),
    'public',
    'search-index.json'
  )
  cachedIndex = JSON.parse(
    fs.readFileSync(indexPath, 'utf-8')
  ) as SearchDocument[]
  return cachedIndex
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 1)
}

function scoreDoc(doc: SearchDocument, tokens: string[]): number {
  let score = 0
  const titleLower = doc.title.toLowerCase()
  const headingsLower = doc.headings.map((h) => h.toLowerCase())
  const contentLower = doc.content.toLowerCase()

  for (const token of tokens) {
    if (titleLower.includes(token)) score += TITLE_WEIGHT
    for (const heading of headingsLower) {
      if (heading.includes(token)) {
        score += HEADING_WEIGHT
        break
      }
    }
    if (contentLower.includes(token)) score += CONTENT_WEIGHT
  }

  return score
}

export function getRelevantContext(userMessage: string): string {
  const index = loadIndex()
  const tokens = tokenize(userMessage)

  let selected: SearchDocument[]

  if (tokens.length === 0) {
    selected = index.slice(0, TOP_N)
  } else {
    const scored = index
      .map((doc) => ({ doc, score: scoreDoc(doc, tokens) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_N)

    selected =
      scored.length > 0
        ? scored.map((entry) => entry.doc)
        : index.slice(0, TOP_N)
  }

  return selected
    .map(
      (doc) =>
        `[${doc.category}] ${doc.title} (${doc.url})\n${doc.content.substring(0, MAX_CONTENT_LENGTH)}`
    )
    .join('\n\n---\n\n')
}
