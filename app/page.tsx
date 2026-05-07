/**
 * app/page.tsx — Homepage
 *
 * Server Component (nessun 'use client' → di default è Server Component).
 * HeroSection importa HeroCanvas via dynamic() con ssr:false, quindi
 * l'intera pipeline Three.js rimane lato client senza inquinare il server.
 */

import HeroSection from '@/components/hero/HeroSection'

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      {/*
       * Le sezioni successive (Servizi, Portfolio, ecc.) andranno qui.
       * Avranno position:relative normale (non fixed/absolute come la hero),
       * quindi si "impileranno" sotto la hero section nello scroll naturale.
       */}
    </main>
  )
}