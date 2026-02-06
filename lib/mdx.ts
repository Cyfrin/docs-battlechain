import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface MDXFrontmatter {
  title?: string
  description?: string
  icon?: string
  [key: string]: unknown
}

export interface MDXContent {
  content: string
  frontmatter: MDXFrontmatter
  slug: string
}

const contentDirectory = path.join(process.cwd(), 'content')

export function getAllMDXFiles(directory: string): string[] {
  const fullPath = path.join(contentDirectory, directory)

  if (!fs.existsSync(fullPath)) {
    return []
  }

  const files: string[] = []

  function readDirectory(dir: string, base: string = ''): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    entries.forEach((entry) => {
      const relativePath = base ? `${base}/${entry.name}` : entry.name

      if (entry.isDirectory()) {
        readDirectory(path.join(dir, entry.name), relativePath)
      } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
        // Remove file extension
        const slug = relativePath.replace(/\.(mdx|md)$/, '')
        files.push(slug)
      }
    })
  }

  readDirectory(fullPath)
  return files
}

export function getMDXContent(directory: string, slug: string | string[]): MDXContent | null {
  const slugPath = Array.isArray(slug) ? slug.join('/') : slug
  const fullPath = path.join(contentDirectory, directory, `${slugPath}.mdx`)
  const mdPath = path.join(contentDirectory, directory, `${slugPath}.md`)

  let filePath: string | null = null

  if (fs.existsSync(fullPath)) {
    filePath = fullPath
  } else if (fs.existsSync(mdPath)) {
    filePath = mdPath
  }

  if (!filePath) {
    return null
  }

  const fileContents = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContents)

  return {
    content,
    frontmatter: data as MDXFrontmatter,
    slug: slugPath,
  }
}

export function getMDXContentByPath(filePath: string): MDXContent | null {
  const fullPath = path.join(contentDirectory, filePath)

  if (!fs.existsSync(fullPath)) {
    return null
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  return {
    content,
    frontmatter: data as MDXFrontmatter,
    slug: filePath.replace(/\.(mdx|md)$/, ''),
  }
}
