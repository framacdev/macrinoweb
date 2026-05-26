/**
 * Preset ribbon per viewport tablet: da 768px a 1024px.
 *
 * Applicato in produzione via media query nel tick() di HeroCanvasCore.
 * In dev, Leva mantiene i default desktop — regola manualmente se serve testare.
 *
 * WHY: (min-width: 768px) and (max-width: 1024px) isola il range tablet
 * senza toccare phone portrait (< 768px) né desktop (> 1024px).
 * Il preset mobile landscape (orientation + pointer: coarse, max 1024px)
 * ha priorità superiore ed è valutato per primo nel tick() — nessuna
 * sovrapposizione in pratica.
 */

export const TABLET_MQ = '(min-width: 768px) and (max-width: 1024px)' as const

/**
 * Solo i valori che differiscono dai default desktop.
 * I campi non presenti vengono letti da `ctrlRef.current` come al solito.
 */
export const TABLET_PRESET = {
  camFov: 55,
  posX: -5,
  posY: -1.15,
  scale: 2.5,
} as const
