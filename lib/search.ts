import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import {
  substituteDeploymentTokens,
  substituteActiveTokens,
  resolveActiveField,
} from './deployments'

// Resolve <NetworkValue field="..." /> to concrete text before stripMarkdown
// wipes JSX tags — otherwise pages that rely on it get garbled sentences and
// empty table cells in the search index. Mirrors lib/strip-mdx.ts: tag bare
// NetworkValue inside testnet-scoped blocks with network="testnet", then
// resolve everything (mainnet default).
function inlineNetworkValues(raw: string): string {
  const tagged = raw.replace(
    /(<Network\s+title="Testnet"\s*>|<TestnetOnly[^>]*>)([\s\S]*?)(<\/Network>|<\/TestnetOnly>)/g,
    (_m, open: string, body: string, close: string) =>
      `${open}${body.replace(/<NetworkValue\s+(?![^>]*\bnetwork=)/g, '<NetworkValue network="testnet" ')}${close}`,
  )
  return tagged.replace(/<NetworkValue\s+((?:[^>]|\/(?!>))*?)\s*\/>/g, (_m, attrs: string) => {
    const field = attrs.match(/field="([^"]*)"/)?.[1]
    if (!field) return ''
    const net = attrs.match(/network="([^"]*)"/)?.[1] === 'testnet' ? 'testnet' : 'mainnet'
    const path = attrs.match(/path="([^"]*)"/)?.[1] ?? ''
    return `${resolveActiveField(net, field)}${path}`
  })
}

export interface SearchDocument {
  id: string
  title: string
  content: string
  url: string
  category: string
  headings: string[]
}

function getAllMDXFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = []

  try {
    const items = fs.readdirSync(dir)

    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        files.push(...getAllMDXFiles(fullPath, baseDir))
      } else if (item.endsWith('.mdx') || item.endsWith('.md')) {
        files.push(fullPath)
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
  }

  return files
}

function extractHeadings(content: string): string[] {
  const headingRegex = /^#{1,6}\s+(.+)$/gm
  const headings: string[] = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    headings.push(match[1].trim())
  }

  return headings
}

function stripMarkdown(content: string): string {
  return content
    // Remove MDX components
    .replace(/<[^>]+>/g, '')
    // Remove markdown links but keep text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove headings markers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildSearchIndex(): SearchDocument[] {
  const contentDir = path.join(process.cwd(), 'content')
  const documents: SearchDocument[] = []

  const mdxFiles = getAllMDXFiles(contentDir)

  for (const filePath of mdxFiles) {
    // Skip docs-markdowns directory (archive/backup files)
    if (filePath.includes('docs-markdowns')) {
      continue
    }
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const { data, content: rawContent } = matter(fileContent)
      // %%active.*%% has no toggle in the static index — degrade to mainnet
      // (testnet inside testnet-scoped blocks). Resolve <NetworkValue> too,
      // before stripMarkdown removes JSX tags.
      const content = substituteDeploymentTokens(
        inlineNetworkValues(substituteActiveTokens(rawContent, 'mainnet')),
      )

      // Get the relative path from content directory
      const relativePath = path.relative(contentDir, filePath)
      // Convert to URL (remove .mdx/.md extension)
      const url = '/' + relativePath.replace(/\.(mdx|md)$/, '')

      // Extract category (first directory in path)
      const category = relativePath.split(path.sep)[0] || 'docs'

      // Extract headings
      const headings = extractHeadings(content)

      // Get title from frontmatter or first heading
      const title = data.title || headings[0] || path.basename(filePath, path.extname(filePath))

      // Strip markdown and get clean text content
      const cleanContent = stripMarkdown(content)

      documents.push({
        id: url,
        title,
        content: cleanContent.substring(0, 1000), // Limit content length for search
        url,
        category,
        headings: headings.slice(0, 5), // Top 5 headings
      })
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error)
    }
  }

  return documents
}
