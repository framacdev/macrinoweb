'use client'

/**
 * ThemeProvider — wrapper per next-themes
 *
 * 'use client' è necessario perché next-themes usa context React,
 * che funziona solo lato client. I Server Components non possono
 * usare context o state.
 *
 * attribute="class" → next-themes aggiunge la classe "dark" all'elemento
 * <html> quando l'utente sceglie la dark mode. Questo è il meccanismo
 * che Tailwind e le nostre CSS variables usano per cambiare tema.
 *
 * defaultTheme="light" → il sito parte in light mode.
 * enableSystem={false} → ignoriamo la preferenza di sistema dell'utente:
 * scelta più controllabile per un portfolio con design specifico.
 * disableTransitionOnChange={true} → al click sul toggle (sole/luna)
 * next-themes inietta `*{transition:none !important}` SOLO durante lo switch,
 * forza un reflow, applica la classe .dark e rimuove l'override. Risultato:
 * OGNI colore (CSS-var, inline, JS) scatta nello stesso frame, senza alcun
 * fade di tema; le transizioni di hover/focus restano intatte perché lo
 * stile di blocco esiste solo per l'istante del cambio. È la soluzione
 * idiomatica e a sorgente unica per "tutti i colori cambiano istantaneamente".
 */

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ReactNode } from 'react'

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange={true}
    >
      {children}
    </NextThemesProvider>
  )
}
