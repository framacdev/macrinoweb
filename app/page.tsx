/**
 * app/page.tsx — Homepage
 *
 * Server Component (nessun 'use client' → di default è Server Component).
 * HeroSection orchestra poster + gate WebGL; HeroCanvas è dynamic ssr:false
 * nel modulo `HeroCanvas.tsx` così Three resta solo client.
 */

import dynamic from 'next/dynamic'

import HeroSection from '@/components/hero/HeroSection'

// TechMarquee è sotto la piega e tutto client-side (23 SVG inline + pointer
// handlers): lo splittiamo in un chunk a parte così non pesa sul JS iniziale.
// SSR resta attivo (nessun ssr:false) → HTML presente, niente pop-in né perdita
// SEO degli aria-label dei loghi.
const TechMarquee = dynamic(() => import('@/components/sections/TechMarquee'))
// Sotto la piega, client (framer-motion + theme): chunk separato, SSR attivo
// (niente ssr:false) → HTML presente per SEO, nessun pop-in.
const FeaturedProject = dynamic(
  () => import('@/components/sections/FeaturedProject')
)

export default function HomePage() {
  return (
    <main id="contenuto" tabIndex={-1}>
      <HeroSection />
      <TechMarquee />
      {/*
       * WHY: wrapper .depth — UN SOLO sfondo a gradiente (superficie → abisso)
       * condiviso da tutte le sezioni post-hero, che restano trasparenti. Vedi
       * globals.css. Il gradiente si "stira" sull'altezza dei figli: scrollando
       * si scende in profondità. Pensato per ~5 sezioni — con poche sezioni è più
       * compresso, si distende man mano che se ne aggiungono. In dark: fondo navy
       * pieno + luci/caustiche. Le prossime sezioni (Servizi, Contatti, ecc.) vanno
       * qui dentro, NON con uno sfondo proprio.
       */}
      <div className="depth">
        <FeaturedProject />
      </div>
    </main>
  )
}
