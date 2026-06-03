import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /ribbon-capture è uno strumento dev (in prod mostra solo un avviso):
      // non deve finire nell'indice.
      disallow: '/ribbon-capture',
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
