import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UPLim - The Human Programming Language',
  description: 'Simple to read. Safe by default. Fast everywhere. The future of programming.',
  generator: 'v0.app',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
      </body>
    </html>
  )
}
