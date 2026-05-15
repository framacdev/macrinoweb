import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import Header from '@/components/layout/Header'
import LevaGate from '@/components/ui/LevaGate'

// Variable fonts: Next.js loads a single .woff2 covering the full weight range.
// Omitting `weight` opts into the variable font — no per-weight preload files.
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Francesco Macrino — Web Developer',
  description:
    'Web Developer con focus su qualità, performance e risultati concreti. Trasformo idee e problemi complessi in soluzioni digitali efficaci.',
  metadataBase: new URL('https://macrinoweb.com'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // data-scroll-behavior="smooth" tells Next.js to temporarily disable smooth
    // scrolling during route transitions, preventing jarring UX on navigation.
    <html lang="it" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${plusJakartaSans.variable} antialiased min-h-screen`}
      >
        <ThemeProvider>
          <LevaGate />
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
