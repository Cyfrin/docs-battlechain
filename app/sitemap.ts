import { MetadataRoute } from 'next'
import { getAllPagePaths } from '@/lib/navigation'

const BASE_URL = 'https://docs.battlechain.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = getAllPagePaths()

  const pages: MetadataRoute.Sitemap = paths.map((pagePath) => ({
    url: `${BASE_URL}/${pagePath}`,
    changeFrequency: 'weekly',
  }))

  // Add the root/overview page
  pages.unshift({
    url: BASE_URL,
    changeFrequency: 'weekly',
  })

  return pages
}
