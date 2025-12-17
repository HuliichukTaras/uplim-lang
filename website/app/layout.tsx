import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UPLim - The Human Programming Language',
  description: 'A minimal, cross-platform language with a built-in WASM compiler and AI-driven architecture. Build apps without boilerplate.',
  keywords: ['uplim', 'minimal language', 'cross-platform language', 'WASM compiler', 'Uplim REPL', 'programming language'],
  authors: [{ name: 'Taras Huliichuk', url: 'https://github.com/Huliichuk' }],
  creator: 'Taras Huliichuk',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://uplim.org',
    title: 'UPLim - The Human Programming Language',
    description: 'Simple to read. Safe by default. Fast everywhere. Built for the AI era.',
    siteName: 'UPLim',
    images: [{
      url: '/og-image.png', // Ensure this image exists later or use a placeholder
      width: 1200,
      height: 630,
      alt: 'UPLim Programming Language'
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UPLim - The Human Programming Language',
    description: 'Simple to read. Safe by default. Fast everywhere.',
    images: ['/og-image.png'],
    creator: '@uplim_lang',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ProgrammingLanguage',
      name: 'UPLim',
      description: 'A minimal, cross-platform language with a built-in WASM compiler.',
      url: 'https://uplim.org',
      author: {
        '@type': 'Person',
        name: 'Taras Huliichuk',
        url: 'https://github.com/Huliichuk'
      },
      creator: {
        '@type': 'Person',
        name: 'Taras Huliichuk'
      },
      applicationCategory: 'Development Tool',
      operatingSystem: 'Cross-platform',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      }
    },
    {
      '@type': 'SoftwareApplication',
      name: 'UPLim Compiler',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Cross-platform',
      url: 'https://uplim.org/compiler'
    }
  ]
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  )
}
