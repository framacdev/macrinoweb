'use client'

import dynamic from 'next/dynamic'

const LevaPanel = dynamic(() => import('./LevaPanel'), { ssr: false })

/** Monta Leva solo in dev: il chunk `leva` non viene richiesto in produzione. */
export default function LevaGate() {
  if (process.env.NODE_ENV !== 'development') return null
  return <LevaPanel />
}
