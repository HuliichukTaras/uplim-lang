import type React from "react"
import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"
import { AppLayout } from "@/components/app-layout"
import { generateSEOMetadata, DEFAULT_SEO, resolveOgImageUrl } from "@/lib/seo/metadata"
import { GoogleAdsTracker } from "@/components/google-ads-tracker"
import "@/app/globals.css"

const GTM_ID = "GTM-MV7XV6NJ"

const selectedOgImage = resolveOgImageUrl(DEFAULT_SEO.getOgImage(), DEFAULT_SEO.siteUrl)

export const metadata: Metadata = {
  ...generateSEOMetadata({
    title: DEFAULT_SEO.title,
    description: DEFAULT_SEO.description,
    url: DEFAULT_SEO.siteUrl,
    image: selectedOgImage,
  }),
  metadataBase: new URL("https://fantikx.com"),
  icons: {
    icon: [
      { url: "/icon-white.png", type: "image/png" },
      { url: "/icon-white.png", type: "image/png" },
    ],
    apple: "/icon-white.png",
    shortcut: "/icon-white.png",
  },
  openGraph: {
    title: "Fantikx — Safe Creator Social Network",
    description:
      "Share exclusive content, set your price, and earn from every unlock. Your content, your rules, your income.",
    url: "https://fantikx.com",
    siteName: "Fantikx",
    images: [
      {
        url: selectedOgImage,
        width: 1200,
        height: 630,
        alt: "Fantikx - Platform for Creators with No Limits",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fantikx — Safe Creator Social Network",
    description:
      "Share exclusive content, set your price, and earn from every unlock. Your content, your rules, your income.",
    images: [selectedOgImage],
    creator: "@fantikx",
    site: "@fantikx",
  },
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const messages = await getMessages()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Fantikx",
    description:
      "Share exclusive content, set your price, and earn from every unlock. Your content, your rules, your income.",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://fantikx.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${process.env.NEXT_PUBLIC_BASE_URL || "https://fantikx.com"}/discover?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "Fantikx",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://fantikx.com"}/logo.png`,
      },
    },
  }

  return (
    <>
      <Script id="gtm-head" strategy="afterInteractive">
        {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `}
      </Script>
      <link
        rel="stylesheet"
        href="https://cdn-uicons.flaticon.com/2.6.0/uicons-regular-rounded/css/uicons-regular-rounded.css"
      />
      <link
        rel="stylesheet"
        href="https://cdn-uicons.flaticon.com/2.6.0/uicons-solid-rounded/css/uicons-solid-rounded.css"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>

      <Script src="https://www.googletagmanager.com/gtag/js?id=AW-17751432581" strategy="afterInteractive" />
      <Script id="google-ads-tag" strategy="afterInteractive">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17751432581');
          `}
      </Script>
      <GoogleAdsTracker conversionId="AW-17751432581" />

      <NextIntlClientProvider messages={messages} locale={params.locale}>
        <AppLayout>{children}</AppLayout>
      </NextIntlClientProvider>
      <Analytics />
    </>
  )
}
