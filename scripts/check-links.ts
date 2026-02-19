import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { getAllPagePaths } from '../lib/navigation'

const CONTENT_DIR = path.join(process.cwd(), 'content')

const CROSS_PRODUCT_PREFIXES = [
  'codehawks',
  'updraft',
  'solodit',
  'profiles',
]

interface BrokenLink {
  file: string
  line: number
  link: string
}

function collectMDXFiles(dir: string): string[] {
  const files: string[] = []
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item)
    if (fs.statSync(fullPath).isDirectory()) {
      files.push(...collectMDXFiles(fullPath))
    } else if (item.endsWith('.mdx')) {
      files.push(fullPath)
    }
  }
  return files
}

function buildValidPaths(mdxFiles: string[]): Set<string> {
  const paths = new Set<string>()
  for (const file of mdxFiles) {
    const rel = path.relative(CONTENT_DIR, file)
      .replace(/\.mdx$/, '')
    paths.add(rel)
  }
  return paths
}

function normalizeLink(link: string): string {
  let normalized = link.split('#')[0]
  if (normalized.startsWith('/')) {
    normalized = normalized.slice(1)
  }
  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }
  return normalized
}

function isCrossProduct(normalized: string): boolean {
  return CROSS_PRODUCT_PREFIXES.some(
    (prefix) => normalized === prefix
      || normalized.startsWith(`${prefix}/`)
  )
}

function stripFencedCodeBlocks(body: string): string {
  return body.replace(/^```[\s\S]*?^```/gm, (match) => {
    const lineCount = match.split('\n').length
    return '\n'.repeat(lineCount - 1)
  })
}

function extractLinksFromBody(
  body: string,
): Array<{ line: number; link: string }> {
  const stripped = stripFencedCodeBlocks(body)
  const lines = stripped.split('\n')
  const results: Array<{ line: number; link: string }> = []

  const mdLinkRe = /\[[^\]]*\]\((\/[^)]+)\)/g
  const hrefRe = /href="(\/[^"]+)"/g

  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i]
    for (const re of [mdLinkRe, hrefRe]) {
      re.lastIndex = 0
      let match
      while ((match = re.exec(lineText)) !== null) {
        results.push({ line: i + 1, link: match[1] })
      }
    }
  }

  return results
}

function checkNavigation(validPaths: Set<string>): BrokenLink[] {
  const broken: BrokenLink[] = []
  for (const pagePath of getAllPagePaths()) {
    if (!validPaths.has(pagePath)) {
      broken.push({
        file: 'config/docs.json',
        line: 0,
        link: pagePath,
      })
    }
  }
  return broken
}

function checkMDXFile(
  filePath: string,
  validPaths: Set<string>,
): BrokenLink[] {
  const broken: BrokenLink[] = []
  const relFile = path.relative(process.cwd(), filePath)
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  const frontmatterLineCount = raw.indexOf(content)
    ? raw.substring(0, raw.indexOf(content)).split('\n').length - 1
    : 0

  for (const field of ['prev', 'next'] as const) {
    const value = data[field]
    if (typeof value === 'string') {
      const normalized = normalizeLink(value)
      if (!isCrossProduct(normalized) && !validPaths.has(normalized)) {
        broken.push({ file: relFile, line: 0, link: value })
      }
    }
  }

  for (const { line, link } of extractLinksFromBody(content)) {
    const normalized = normalizeLink(link)
    if (normalized === '' || isCrossProduct(normalized)) {
      continue
    }
    if (!validPaths.has(normalized)) {
      broken.push({
        file: relFile,
        line: line + frontmatterLineCount,
        link,
      })
    }
  }

  return broken
}

function main(): void {
  const mdxFiles = collectMDXFiles(CONTENT_DIR)
  const validPaths = buildValidPaths(mdxFiles)
  const broken: BrokenLink[] = []

  broken.push(...checkNavigation(validPaths))

  for (const file of mdxFiles) {
    broken.push(...checkMDXFile(file, validPaths))
  }

  if (broken.length === 0) {
    console.log('No broken links found.')
    process.exit(0)
  }

  console.error(`Found ${broken.length} broken link(s):\n`)
  for (const { file, line, link } of broken) {
    const loc = line > 0 ? `${file}:${line}` : file
    console.error(`  ${loc} -> ${link}`)
  }
  process.exit(1)
}

main()
