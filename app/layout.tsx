import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import Header from '@/components/layout/Header'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
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
    <html lang="it" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${plusJakartaSans.variable} antialiased min-h-screen`}
      >
        <ThemeProvider>
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
