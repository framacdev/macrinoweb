import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/site'

// Solo la home, l'unica pagina con contenuto reale. /chi-sono, /portfolio e
// /contatti sono ancora stub: vanno aggiunte qui quando avranno contenuto, per
// non invitare l'indicizzazione di pagine vuote.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ]
}
