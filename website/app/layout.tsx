import type React from "react"
import type { Metadata } from "next"
import { Geist_Mono, Inter, Source_Serif_4 } from "next/font/google"

import { defaultLocale } from "@/i18n/config"

import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-inter",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-geist-mono",
})

const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-source-serif-4",
})

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
  icons: {
    icon: "/icon.svg",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang={defaultLocale}>
      <body
        className={`${inter.className} ${geistMono.variable} ${sourceSerif4.variable} antialiased overflow-x-hidden bg-background`}
      >
        {children}
      </body>
    </html>
  )
}
