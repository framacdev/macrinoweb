'use client'

import { useEffect, useState } from 'react'
import AnimatedArrowIcon from '@/components/ui/AnimatedArrowIcon'
import { useTheme } from 'next-themes'
import { C } from '@/lib/constants'
import {
  primaryButtonStyle,
  primaryButtonForeground,
} from '@/lib/primaryButtonStyle'

interface ButtonProps {
  variant?: 'primary' | 'secondary'
  label: string
  href?: string
  onClick?: () => void
}

export default function Button({
  variant = 'primary',
  label,
  href,
  onClick,
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // WHY: rAF garantisce che mounted diventi true solo dopo il primo paint —
    // stesso pattern dell'Header per evitare hydration mismatch sul tema.
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const isDark = mounted && theme === 'dark'

  const handlers = {
    onPointerEnter: () => setIsHovered(true),
    onPointerLeave: () => setIsHovered(false),
    onPointerCancel: () => setIsHovered(false),
  }

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '10px 28px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 600,
    fontFamily: 'var(--font-inter)',
    letterSpacing: '0.02em',
    textDecoration: 'none',
  }

  let style: React.CSSProperties
  let arrowColor: string

  if (variant === 'primary') {
    // Aspetto del primary da single source (primaryButtonStyle). Qui WITH alone
    // (A): il bottone hero poggia direttamente sul ribbon three.js.
    arrowColor = primaryButtonForeground(isDark)
    style = {
      ...baseStyle,
      ...primaryButtonStyle({ isDark, isHovered, withHalo: true }),
    }
  } else {
    arrowColor = ''
    // WHY: colori espliciti invece di opacity trick — garantisce contrasto WCAG
    // in ogni stato e permette transizioni cromatiche precise.
    style = {
      ...baseStyle,
      // Usa color-mix per applicare il 50% di opacità a una variabile HEX
      backgroundColor: 'color-mix(in srgb, var(--color-bg) 50%, transparent)',

      // Aggiungi il filtro blur
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)', // Fondamentale per Safari

      color: isDark
        ? isHovered
          ? '#2a9ae8'
          : C.accent
        : isHovered
          ? '#1A5BB8'
          : C.primary,
      border: `1px solid ${
        isDark
          ? isHovered
            ? '#2a9ae8'
            : `color-mix(in srgb, ${C.accent} 50%, transparent)`
          : isHovered
            ? '#1A5BB8'
            : `color-mix(in srgb, ${C.primary} 50%, transparent)`
      }`,
      transition:
        'color 0.25s ease-in-out, border-color 0.25s ease-in-out, background-color 0.25s ease-in-out',
    }
  }

  const content = (
    <>
      {label}
      {variant === 'primary' && (
        <AnimatedArrowIcon isHovered={isHovered} color={arrowColor} />
      )}
    </>
  )

  if (href) {
    return (
      <a href={href} style={style} {...handlers}>
        {content}
      </a>
    )
  }
  return (
    <button type="button" onClick={onClick} style={style} {...handlers}>
      {content}
    </button>
  )
}
