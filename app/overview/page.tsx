import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getMDXContent } from '@/lib/mdx'
import { Card } from '@/components/mdx/Card'
import { CardGroup } from '@/components/mdx/CardGroup'
import { Steps, Step } from '@/components/mdx/Steps'
import { Accordion, AccordionGroup } from '@/components/mdx/Accordion'
import { Note, Tip, Warning, Danger, Info } from '@/components/mdx/Callouts'
import { CodeGroup } from '@/components/mdx/CodeGroup'
import { Latex } from '@/components/mdx/Latex'
import { Expandable } from '@/components/mdx/Expandable'
import { ResponseField } from '@/components/mdx/ResponseField'
import { SnippetIntro } from '@/components/mdx/SnippetIntro'
import { BattlechainHeroClient } from '@/components/hero/BattlechainHeroClient'
import { Pre } from '@/components/mdx/Pre'
import remarkGfm from 'remark-gfm'
import rehypePrismPlus from 'rehype-prism-plus'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const components = {
  Card,
  CardGroup,
  Steps,
  Step,
  Accordion,
  AccordionGroup,
  Note,
  Tip,
  Warning,
  Danger,
  Info,
  CodeGroup,
  Latex,
  Expandable,
  ResponseField,
  SnippetIntro,
  BattlechainHero: BattlechainHeroClient,
  pre: Pre,
}

export default async function OverviewPage() {
  // Read the overview.mdx file directly from content root
  const filePath = path.join(process.cwd(), 'content', 'overview.mdx')

  if (!fs.existsSync(filePath)) {
    notFound()
  }

  const fileContent = fs.readFileSync(filePath, 'utf8')
  const { content, data: frontmatter } = matter(fileContent)

  return (
    <div className="max-w-none">
      <MDXRemote
        source={content}
        components={components}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [[rehypePrismPlus, { ignoreMissing: true }]],
          },
        }}
      />
    </div>
  )
}
