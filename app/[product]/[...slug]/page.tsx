import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getMDXContent, getAllMDXFiles } from '@/lib/mdx'
import { getAdjacentPages, getPageTitle } from '@/lib/navigation'
import { stripMdxToMarkdown } from '@/lib/strip-mdx'
import { PageNav } from '@/components/layout/PageNav'
import { PageActions } from '@/components/layout/PageActions'
import { Card } from '@/components/mdx/Card'
import { CardGroup } from '@/components/mdx/CardGroup'
import { Steps, Step } from '@/components/mdx/Steps'
import { Accordion, AccordionGroup } from '@/components/mdx/Accordion'
import { Note, Tip, Warning, Danger, Info, Check } from '@/components/mdx/Callouts'
import { NetworkInfo } from '@/components/mdx/NetworkInfo'
import { CodeGroup } from '@/components/mdx/CodeGroup'
import { Latex } from '@/components/mdx/Latex'
import { Expandable } from '@/components/mdx/Expandable'
import { Tabs, Tab } from '@/components/mdx/Tabs'
import { Network } from '@/components/mdx/NetworkTabs'
import { ResponseField } from '@/components/mdx/ResponseField'
import { SnippetIntro } from '@/components/mdx/SnippetIntro'
import { BattlechainHeroClient } from '@/components/hero/BattlechainHeroClient'
import { Pre } from '@/components/mdx/Pre'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrismPlus from 'rehype-prism-plus'

function MdxLink({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isExternal = href?.startsWith('http://') || href?.startsWith('https://')
  return (
    <a
      href={href}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...props}
    />
  )
}

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
  Tabs,
  Tab,
  Network,
  BattlechainHero: BattlechainHeroClient,
  pre: Pre,
  a: MdxLink,
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
  const cleanMarkdown = stripMdxToMarkdown(content)
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
    <>
    <PageActions
      markdownContent={cleanMarkdown}
      title={frontmatter.title}
      description={frontmatter.description}
      editUrl={editUrl}
    />
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
            rehypePlugins: [
              rehypeSlug,
              [rehypeAutolinkHeadings, { behavior: 'wrap' }],
              [rehypePrismPlus, { defaultLanguage: 'plaintext', ignoreMissing: true }],
            ],
          },
        }}
      />
      <PageNav prev={prev} next={next} />
    </article>
    </>
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
  const title = frontmatter.title || 'BattleChain Docs'
  const description = frontmatter.description || 'BattleChain Documentation'
  const pageUrl = `https://docs.battlechain.com/${product}/${path}`

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'BattleChain Docs',
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}
