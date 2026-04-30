'use client'

/**
 * LevaPanel — wrapper per il pannello di controllo Leva.
 *
 * Da montare A LIVELLO ROOT dell'app (in app/layout.tsx), così sfugge a
 * qualsiasi stacking context creato da Header, Hero, Canvas WebGL e simili.
 *
 * Pattern raccomandato dalla doc ufficiale di Leva:
 * https://github.com/pmndrs/leva
 *
 * Il pannello è invisibile in produzione (process.env.NODE_ENV !== 'development')
 * grazie all'early return + tree-shaking di webpack.
 */

import { Leva } from 'leva'

const IS_DEV = process.env.NODE_ENV === 'development'

export default function LevaPanel() {
  // In production webpack vede questa branca come dead code (NODE_ENV è
  // inlined a build time) e ottimizza tutto via.
  if (!IS_DEV) return null

  return (
    <Leva
      collapsed={false}
      titleBar={{
        title: 'Ribbon controls (dev)',
        // drag:true permette di spostare il pannello con il mouse
        drag: true,
      }}
    />
  )
}