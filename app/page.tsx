/**
 * app/page.tsx — Homepage
 *
 * Server Component (nessun 'use client' → di default è Server Component).
 * HeroSection orchestra poster + gate WebGL; HeroCanvas è dynamic ssr:false
 * nel modulo `HeroCanvas.tsx` così Three resta solo client.
 */

import HeroSection from '@/components/hero/HeroSection'

export default function HomePage() {
  return (
    <main>
      {/* sr-only: testo accessibile ma invisibile — garantisce che Plus Jakarta Sans
          venga applicato a testo reale, eliminando il warning 'preloaded but not used'. */}
      <h1 className="sr-only">Francesco Macrino — Web Developer</h1>
      <HeroSection />
      {/*
       * Le sezioni successive (Servizi, Portfolio, ecc.) andranno qui.
       * Avranno position:relative normale (non fixed/absolute come la hero),
       * quindi si "impileranno" sotto la hero section nello scroll naturale.
       */}
    </main>
  )
}
