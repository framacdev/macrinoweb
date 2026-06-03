import type { Metadata } from 'next'
import { Sora, Nunito_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import Header from '@/components/layout/Header'
import LevaGate from '@/components/ui/LevaGate'
import { SITE_URL, SITE_TITLE, SITE_DESCRIPTION } from '@/lib/site'

const sora = Sora({
  variable: '--font-sora',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
})

const nunitoSans = Nunito_Sans({
  variable: '--font-nunito',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
})

// JSON-LD Person: dà a Google/AI un'entità strutturata su chi è Francesco e
// cosa sa fare. knowsAbout elenca lo stack reale mostrato nel marquee.
const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Francesco Macrino',
  jobTitle: 'Web Developer',
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  knowsAbout: [
    'Frontend Development',
    'React',
    'Next.js',
    'TypeScript',
    'Three.js',
    'Web Performance',
    'Web Accessibility',
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
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
        className={`${sora.variable} ${nunitoSans.variable} ${jetbrainsMono.variable} antialiased min-h-screen`}
      >
        {/* JSON-LD Person — entità strutturata per motori di ricerca e AI. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <ThemeProvider>
          {/* Skip-link: prima voce in tab order, salta header e hero diretto al
              contenuto. Invisibile finché non riceve focus da tastiera. */}
          <a href="#contenuto" className="skip-link">
            Vai al contenuto
          </a>
          <LevaGate />
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
