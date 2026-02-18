import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getMDXContent, getAllMDXFiles } from '@/lib/mdx'
import { Card } from '@/components/mdx/Card'
import { CardGroup } from '@/components/mdx/CardGroup'
import { Steps, Step } from '@/components/mdx/Steps'
import { Accordion, AccordionGroup } from '@/components/mdx/Accordion'
import { Note, Tip, Warning, Danger, Info, Check } from '@/components/mdx/Callouts'
import { NetworkInfo } from '@/components/mdx/NetworkInfo'
import { CodeGroup } from '@/components/mdx/CodeGroup'
import { Latex } from '@/components/mdx/Latex'
import { Expandable } from '@/components/mdx/Expandable'
import { ResponseField } from '@/components/mdx/ResponseField'
import { SnippetIntro } from '@/components/mdx/SnippetIntro'
import { BattlechainHero } from '@/components/hero/BattlechainHero'
import { Pre } from '@/components/mdx/Pre'
import remarkGfm from 'remark-gfm'
import rehypePrismPlus from 'rehype-prism-plus'

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
  Check,
  NetworkInfo,
  CodeGroup,
  Latex,
  Expandable,
  ResponseField,
  SnippetIntro,
  BattlechainHero,
  pre: Pre,
}

export async function generateStaticParams() {
  const directories = [
    'profiles',
    'codehawks',
    'updraft',
    'solodit',
    'battlechain',
    'ai-tools',
    'api-reference',
    'essentials',
    'snippets'
  ]
  const params: { product: string; slug: string[] }[] = []

  for (const dir of directories) {
    const files = getAllMDXFiles(dir)
    for (const file of files) {
      const slug = file.split('/')
      params.push({ product: dir, slug })
    }
  }

  return params
}

interface PageProps {
  params: Promise<{
    product: string
    slug: string[]
  }>
}

export default async function Page({ params }: PageProps) {
  const { product, slug } = await params
  const path = slug.join('/')

  const mdxContent = getMDXContent(product, path)

  if (!mdxContent) {
    notFound()
  }

  const { content, frontmatter } = mdxContent

  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      {frontmatter.title && (
        <h1>{frontmatter.title}</h1>
      )}
      {frontmatter.description && (
        <p className="text-xl text-gray-600 dark:text-gray-400 -mt-4 mb-8">
          {frontmatter.description}
        </p>
      )}
      <MDXRemote
        source={content}
        components={components}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [[rehypePrismPlus, { defaultLanguage: 'plaintext', ignoreMissing: true }]],
          },
        }}
      />
    </article>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { product, slug } = await params
  const path = slug.join('/')

  const mdxContent = getMDXContent(product, path)

  if (!mdxContent) {
    return {
      title: 'BattleChain Docs',
      description: 'BattleChain Documentation',
    }
  }

  const { frontmatter } = mdxContent

  return {
    title: frontmatter.title || 'BattleChain Docs',
    description: frontmatter.description || 'BattleChain Documentation',
  }
}
