/**
 * page.tsx — homepage del sito.
 *
 * Per ora monta solo la Hero. Nelle prossime iterazioni aggiungerò:
 * - Sezione "Servizi" (inline)
 * - Anteprima portfolio (con link al portfolio completo)
 * - Footer
 *
 * NOTA: questo è un Server Component (default in App Router). Hero.tsx ha
 * 'use client' al suo interno perché contiene WebGL e dynamic import, ma
 * la pagina che lo wrappa può rimanere server-rendered. Questo significa
 * che il primo HTML inviato al browser contiene già il markup statico
 * della pagina, mentre il JS della Hero viene idratato dopo. Best practice
 * Next.js per ottimizzare TTFB (Time To First Byte).
 */

import Hero from '@/components/sections/Hero'

export default function HomePage() {
  return (
    <main>
      <Hero />
    </main>
  )
}