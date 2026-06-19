import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { battlechain } from '@/config/battlechain'
import { resolveField, substituteTokens } from '@/lib/network-fields'

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
    // Resolve <NetworkValue field="..." /> to its value (mainnet default) so
    // RPC URLs / addresses stay searchable. Done before the generic tag strip.
    .replace(/<NetworkValue\s+([^/>]*?)\/>/g, (_m, attrs: string) => {
      const field = attrs.match(/field="([^"]*)"/)?.[1]
      if (!field) return ''
      const net = attrs.match(/network="([^"]*)"/)?.[1] === 'testnet' ? 'testnet' : 'mainnet'
      return resolveField(battlechain[net], field)
    })
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

// Resolve any {{tokens}} that survive stripping (e.g. inline code) against
// mainnet so the search index never shows raw placeholders.
function resolveTokens(content: string): string {
  return substituteTokens(content, battlechain.mainnet)
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
      const { data, content } = matter(fileContent)

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
      const cleanContent = resolveTokens(stripMarkdown(content))

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
