'use client'

/**
 * HeroSection — wrapper della Hero Section
 *
 * Perché dynamic() con ssr:false?
 *
 * Three.js usa window, document e WebGL API che non esistono sul server
 * (Node.js). Next.js con App Router esegue il codice sia sul server (SSR)
 * che sul client. Se importassi HeroCanvas direttamente, il server
 * crasherebbe tentando di accedere a window.
 *
 * dynamic() con ssr:false dice a Next.js: "questo componente esiste
 * SOLO sul client, non provare a renderizzarlo sul server".
 *
 * Il loading:() => null evita flash di contenuto non stilizzato (FOUC):
 * mentre il bundle Three.js si carica (è pesante), non mostriamo nulla,
 * solo il background CSS del parent che è già corretto.
 */

import dynamic from 'next/dynamic'

const HeroCanvas = dynamic(() => import('./HeroCanvas'), {
  ssr: false,
  loading: () => null,
})

export default function HeroSection() {
  return (
    /*
     * position:relative + overflow:hidden sono obbligatori:
     * - relative: crea il "containing block" per il figlio position:absolute
     *   (il mountRef div dentro HeroCanvas). Senza di esso, il canvas
     *   si posizionerebbe rispetto al viewport o all'elemento positioned
     *   più vicino nell'albero DOM.
     * - overflow:hidden: impedisce che l'onda/torsione del ribbon esca
     *   oltre i bordi della sezione hero creando scrollbar indesiderate.
     *
     * backgroundColor:var(--color-bg) gestisce il colore di sfondo sia
     * in light che in dark mode (il CSS variable cambia automaticamente
     * grazie a ThemeProvider + class-based dark mode). Il canvas Three.js
     * ha alpha:true e renderizza sopra questo colore.
     *
     * 100dvh (dynamic viewport height): unità moderna che esclude la
     * barra degli indirizzi del browser mobile dal calcolo dell'altezza.
     * Usare 100vh su mobile causa problemi di overflow quando la barra
     * degli indirizzi è visibile (occupa spazio ma non è inclusa in 100vh).
     */
    <section
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        overflow: 'hidden',
        backgroundColor: 'var(--color-bg)',
        transition: 'background-color 0.3s ease', // sync con Header.tsx
      }}
    >
      <HeroCanvas />
    </section>
  )
}