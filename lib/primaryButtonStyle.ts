import type { CSSProperties } from 'react'
import { C } from '@/lib/constants'

/**
 * primaryButtonStyle — SINGLE SOURCE OF TRUTH dell'aspetto del primary action.
 *
 * Condiviso dal bottone hero "Iniziamo" (components/ui/Button.tsx) e dalla CTA
 * header "Contattami" (components/layout/Header.tsx), così restano identici in
 * entrambi i temi senza duplicare la logica (DRY / SRP). L'unica differenza è
 * l'alone (`withHalo`), che si applica solo dove il bottone poggia direttamente
 * sul ribbon three.js (hero); la CTA header ne fa a meno.
 *
 * Il primary condivide la famiglia-tinta del ribbon, quindi NON si stacca per
 * colore: lo separiamo per VALORE/PROFONDITÀ, a brand invariato —
 *   A) alone morbido in var(--color-bg), theme-adaptive (navy in dark, bianco
 *      in light): ritaglia una micro-zona pulita sul ribbon (solo `withHalo`);
 *   C) ombra di elevazione appena percettibile → piano sopra il canvas;
 *   D) micro-gradiente verticale (highlight in alto, shade in basso) → volume.
 *
 * Ritorna SOLO proprietà d'aspetto: il layout (padding, font, radius, display)
 * resta a carico di ciascun consumer (Interface Segregation — il factory non
 * impone geometrie).
 */

// Foreground condiviso (testo + freccia): navy su accent chiaro in dark,
// bg chiaro su primary in light. Esposto a parte così la freccia SVG combacia.
export function primaryButtonForeground(isDark: boolean): string {
  return isDark ? C.bgDark : C.bg
}

export function primaryButtonStyle({
  isDark,
  isHovered,
  withHalo,
}: {
  isDark: boolean
  isHovered: boolean
  withHalo: boolean
}): CSSProperties {
  // Fill brand, theme-aware. Dark usa accent (#3da9fc): primary (#2273D4) si
  // fonderebbe col ribbon, mentre accent dà alto contrasto interno col testo navy.
  const fill = isDark
    ? isHovered
      ? C.accentHover
      : C.accent
    : isHovered
      ? C.primaryHover
      : C.primary

  // C — profondità: volutamente leggera, il minimo per staccare dal ribbon.
  const depth = isDark
    ? '0 3px 8px rgba(0,0,0,0.18)'
    : '0 3px 8px rgba(9,32,55,0.08)'

  // A — alone morbido al 50% in var(--color-bg) (via color-mix): theme-adaptive,
  // appena accennato, solo dove serve (hero).
  const halo =
    '0 0 6px 1px color-mix(in srgb, var(--color-bg) 15%, transparent)'

  return {
    backgroundColor: fill,
    // D — backgroundImage (non shorthand) per non confliggere con backgroundColor.
    backgroundImage:
      'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 48%, rgba(0,0,0,0.10) 100%)',
    color: primaryButtonForeground(isDark),
    boxShadow: withHalo ? `${halo}, ${depth}` : depth,
    transition:
      'background-color 0.25s ease-in-out, box-shadow 0.25s ease-in-out',
  }
}
