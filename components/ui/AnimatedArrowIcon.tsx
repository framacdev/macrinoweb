'use client'

import { motion } from 'framer-motion'

/**
 * AnimatedArrowIcon — ChevronRight che diventa ArrowRight sull'hover.
 *
 * Componente condiviso dal Button hero ("Parliamone") e dalla CTA header
 * ("Contattami"). `color` segue il foreground del primary (bianco in light,
 * navy su accent in dark): passarlo come prop invece di hardcodarlo è ciò che
 * permette l'unico componente per entrambi i temi e i due call-site.
 *
 * Due path separati con coordinate calibrate per connessione perfetta:
 *
 * ASTA: M4 8 L12 8
 *   strokeLinecap="round" → si estende visivamente oltre i 12px
 *   pathLength 0→1 + opacity 0→1 → l'asta si rivela da sinistra su hover
 *
 * PUNTA: M7 3.5 L12 8 L7 12.5
 *   translateX 0→2 su hover → scorre a destra restando agganciata all'asta
 *   (overlap garantito a ogni frame)
 *
 * CONTAINER: 20px fissi, overflow hidden → il button non cambia mai larghezza.
 * Layering per ORDINE DOM (SVG ignora z-index): l'asta è dichiarata prima.
 */
export default function AnimatedArrowIcon({
  isHovered,
  color,
}: {
  isHovered: boolean
  color: string
}) {
  return (
    <span className="inline-flex items-center w-[20px] h-[16px] -mr-[8px] shrink-0 overflow-hidden">
      <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
        {/* Asta */}
        <motion.path
          d="M 4 8 L 12 8"
          style={{ stroke: color }}
          strokeWidth="1.75"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: isHovered ? 1 : 0,
            opacity: isHovered ? 1 : 0,
          }}
          transition={{ duration: 0.15, ease: 'easeInOut' }}
        />
        {/* Punta — scorre a destra su hover */}
        <motion.path
          d="M 7 3.5 L 12 8 L 7 12.5"
          style={{ stroke: color }}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ x: isHovered ? 2 : 0 }}
          transition={{ duration: 0.15, ease: 'easeInOut' }}
        />
      </svg>
    </span>
  )
}
