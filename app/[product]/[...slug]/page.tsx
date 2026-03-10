import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getMDXContent, getAllMDXFiles } from '@/lib/mdx'
import { getAdjacentPages, getPageTitle } from '@/lib/navigation'
import { PageNav } from '@/components/layout/PageNav'
import { PageActionsDropdown } from '@/components/layout/PageActionsDropdown'
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

export const dynamicParams = false;

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
  const fullPath = `${product}/${path}`

  const mdxContent = getMDXContent(product, path)

  if (!mdxContent) {
    notFound()
  }

  const { content, frontmatter } = mdxContent
  const auto = getAdjacentPages(fullPath)
  const editUrl = `https://github.com/Cyfrin/docs-battlechain/edit/main/content/${fullPath}.mdx`

  const prev = frontmatter.prev === false
    ? null
    : typeof frontmatter.prev === 'string'
      ? { path: frontmatter.prev, title: getPageTitle(frontmatter.prev) }
      : auto.prev

  const next = frontmatter.next === false
    ? null
    : typeof frontmatter.next === 'string'
      ? { path: frontmatter.next, title: getPageTitle(frontmatter.next) }
      : auto.next

  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <div className="not-prose flex items-center justify-end gap-3 mb-2">
        <PageActionsDropdown
          markdownContent={content}
          title={frontmatter.title}
          description={frontmatter.description}
        />
        <a
          href={editUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
          Edit this page
        </a>
      </div>
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
      <PageNav prev={prev} next={next} />
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
