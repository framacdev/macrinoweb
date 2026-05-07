'use client'

/**
 * LevaPanel — wrapper client per il pannello di debug Leva
 *
 * PERCHÉ ESISTE QUESTO FILE?
 * layout.tsx è un Server Component (nessun 'use client' → default server).
 * Leva usa createContext() internamente, che è una API React client-only.
 * Importare { Leva } direttamente in layout.tsx causa l'errore:
 *   "createContext only works in Client Components"
 *
 * La soluzione: isolare l'import di leva in un componente 'use client'
 * separato e importare QUELLO in layout.tsx. Next.js "confina" il codice
 * client-only al sottoalbero che parte da questo componente.
 *
 * Questo è il pattern standard Next.js App Router per wrappare
 * librerie che usano context/hooks in layout che sono Server Components.
 */

import { Leva } from 'leva'

export default function LevaPanel() {
  // hidden in produzione: il pannello non appare nei deploy Vercel
  // process.env.NODE_ENV è una variabile sostituita staticamente da Next.js
  // durante la build → non c'è overhead runtime
  return <Leva hidden={process.env.NODE_ENV !== 'development'} />
}