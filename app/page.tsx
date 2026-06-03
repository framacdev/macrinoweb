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

export default function HomePage() {
  return (
    <main id="contenuto" tabIndex={-1}>
      <HeroSection />
      <TechMarquee />
      {/*
       * Le sezioni successive (Servizi, Portfolio, ecc.) andranno qui.
       * Avranno position:relative normale (non fixed/absolute come la hero),
       * quindi si "impileranno" sotto la hero section nello scroll naturale.
       */}
    </main>
  )
}
