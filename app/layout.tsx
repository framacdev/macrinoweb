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

const SITE_URL = 'https://macrinoweb.com'
const SITE_TITLE = 'Francesco Macrino — Web Developer'
const SITE_DESCRIPTION =
  'Web Developer con focus su qualità, performance e risultati concreti. Trasformo idee e problemi complessi in soluzioni digitali efficaci.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: SITE_URL,
    siteName: 'Francesco Macrino',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    // WHY: /og-image.png va generato e aggiunto in /public/ separatamente.
    // Le dimensioni 1200×630 sono lo standard consigliato da LinkedIn e Facebook.
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
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
