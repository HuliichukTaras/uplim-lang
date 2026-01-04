import type { Metadata } from "next"
import { locales, defaultLocale } from "@/i18n/config"

const getBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_BASE_URL || "https://fantikx.com"
  return url.startsWith("http") ? url : `https://${url}`
}

const OG_IMAGES = ["/og-image1.jpg", "/og-image2.jpg", "/og-image3.jpg"]

export function getDefaultOgImage(): string {
  return OG_IMAGES[0]
}

export function resolveOgImageUrl(imagePath: string, siteUrl: string): string {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, "")

  if (imagePath.startsWith("http")) {
    return imagePath
  }

  const normalizedImagePath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`
  return `${normalizedSiteUrl}${normalizedImagePath}`
}

export const DEFAULT_SEO = {
  siteName: "Fantikx",
  siteUrl: getBaseUrl(),
  title: "Fantikx — Best Creator Platform for Monetizing Exclusive Content",
  description:
    "Top platform for creators to monetize exclusive content. Sell photos, videos, subscriptions. No bans, no limits. Better than OnlyFans. Earn money from your content today!",
  getOgImage: getDefaultOgImage,
  ogImages: OG_IMAGES,
  keywords: [
    // Brand
    "Fantikx",
    "fantikx.com",
    // Primary Keywords (High Volume)
    "creator platform",
    "content monetization",
    "sell exclusive content",
    "make money online",
    "earn from content",
    "subscription platform",
    "fan subscription",
    "paid content platform",
    // Competitor Alternatives (High Intent)
    "OnlyFans alternative",
    "Patreon alternative",
    "Fansly alternative",
    "best creator platform 2025",
    "top fan subscription sites",
    // Content Types
    "sell photos online",
    "sell videos online",
    "premium content",
    "exclusive photos",
    "exclusive videos",
    "adult content platform",
    "18+ content",
    "NSFW platform",
    // Creator Economy
    "creator economy",
    "content creator earnings",
    "influencer monetization",
    "social media monetization",
    "monetize followers",
    "fan engagement platform",
    // Features
    "pay per view content",
    "PPV platform",
    "tip creators",
    "creator subscriptions",
    "unlock exclusive content",
    "private content",
    // Long-tail Keywords
    "how to make money as creator",
    "best platform for adult content",
    "safe creator platform",
    "no restrictions platform",
    "creator freedom",
    "content without censorship",
  ],
} as const

type MetadataProps = {
  title: string
  description: string
  image?: string
  video?: string
  url: string
  type?: "website" | "article" | "profile"
  noIndex?: boolean
  keywords?: string[]
  publishedTime?: string
  author?: string
  videoWidth?: number
  videoHeight?: number
  contentType?: string
  locale?: string // Add locale parameter
}

function generateLanguageAlternates(path: string, currentLocale: string = defaultLocale): Record<string, string> {
  const siteUrl = DEFAULT_SEO.siteUrl.replace(/\/$/, "")

  // Remove locale prefix if present
  const pathWithoutLocale = path.replace(/^\/(en|de|uk|es|fr|ja|ko|pt|ru|tr|zh-CN|zh-TW)/, "")

  const alternates: Record<string, string> = {}

  for (const locale of locales) {
    // Use proper hreflang codes
    const hreflangCode = locale === "zh-CN" ? "zh-Hans" : locale === "zh-TW" ? "zh-Hant" : locale
    alternates[hreflangCode] = `${siteUrl}/${locale}${pathWithoutLocale}`
  }

  // Add x-default pointing to default locale
  alternates["x-default"] = `${siteUrl}/${defaultLocale}${pathWithoutLocale}`

  return alternates
}

export function generateSEOMetadata({
  title,
  description,
  image,
  video,
  url,
  type = "website",
  noIndex = false,
  keywords,
  publishedTime,
  author,
  videoWidth = 1280,
  videoHeight = 720,
  contentType = "video/mp4",
  locale = defaultLocale,
}: MetadataProps): Metadata {
  const baseTitle = "Fantikx"
  const fullTitle =
    title === baseTitle ? DEFAULT_SEO.title : title.includes(baseTitle) ? title : `${title} | ${baseTitle}`

  let siteUrl = DEFAULT_SEO.siteUrl.replace(/\/$/, "")
  if (!siteUrl || !siteUrl.startsWith("http")) {
    siteUrl = "https://fantikx.com"
  }

  let metadataBase: URL
  try {
    metadataBase = new URL(siteUrl)
  } catch (e) {
    console.error("[SEO] Invalid siteUrl:", siteUrl)
    metadataBase = new URL("https://fantikx.com")
  }

  const selectedOgImage = image || getDefaultOgImage()
  const ogImageUrl = resolveOgImageUrl(selectedOgImage, siteUrl)

  const urlPath = url.startsWith("http") ? new URL(url).pathname : url

  const canonicalUrl = url.startsWith("http") ? url : `${siteUrl}/${locale}${urlPath === "/" ? "" : urlPath}`

  return {
    metadataBase,
    title: fullTitle,
    description: description.slice(0, 200),
    keywords: keywords ?? [...DEFAULT_SEO.keywords],
    authors: author ? [{ name: author }] : [{ name: DEFAULT_SEO.siteName }],
    creator: author || DEFAULT_SEO.siteName,
    publisher: DEFAULT_SEO.siteName,
    robots: noIndex
      ? {
        index: false,
        follow: false,
      }
      : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
    openGraph: {
      type: video ? "video.other" : type,
      locale: locale === "zh-CN" ? "zh_CN" : locale === "zh-TW" ? "zh_TW" : `${locale}_${locale.toUpperCase()}`,
      url: canonicalUrl,
      siteName: DEFAULT_SEO.siteName,
      title: fullTitle,
      description: description.slice(0, 200),
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
          type: "image/jpeg",
        },
      ],
      ...(video && {
        videos: [
          {
            url: video,
            secureUrl: video,
            width: videoWidth,
            height: videoHeight,
            type: contentType,
          },
        ],
      }),
      ...(publishedTime && { publishedTime }),
      ...(author && { authors: [author] }),
    },
    twitter: {
      card: video ? "player" : "summary_large_image",
      site: DEFAULT_SEO.siteName,
      creator: DEFAULT_SEO.siteName,
      title: fullTitle,
      description: description.slice(0, 200),
      images: [ogImageUrl],
      ...(video && {
        players: [
          {
            url: video,
            width: videoWidth,
            height: videoHeight,
          },
        ],
      }),
    },
    alternates: {
      canonical: canonicalUrl,
      languages: generateLanguageAlternates(urlPath, locale),
    },
  }
}

export function generatePostMetadata({
  postId,
  caption,
  creatorName,
  creatorHandle,
  thumbnailUrl,
  videoUrl,
  isNSFW,
  createdAt,
  locale = defaultLocale,
}: {
  postId: string
  caption: string
  creatorName: string
  creatorHandle: string
  thumbnailUrl?: string
  videoUrl?: string
  isNSFW?: boolean
  createdAt: string
  locale?: string
}) {
  const baseUrl = DEFAULT_SEO.siteUrl
  const postUrl = `${baseUrl}/${locale}/post/${postId}`

  const cleanCaption = caption ? caption.replace(/\s+/g, " ").trim() : ""
  const title = cleanCaption ? cleanCaption.slice(0, 60) : `Post by ${creatorName}`
  const description = cleanCaption
    ? cleanCaption.slice(0, 160)
    : `View this exclusive content from ${creatorName} on Fantikx.`

  const finalImageUrl = thumbnailUrl
  const finalVideoUrl = isNSFW ? undefined : videoUrl

  return generateSEOMetadata({
    title: `${title} | ${creatorName}`,
    description,
    image: finalImageUrl,
    video: finalVideoUrl,
    url: postUrl,
    type: "article",
    publishedTime: createdAt,
    author: creatorName,
    locale,
    keywords: [
      "Fantikx",
      creatorName,
      creatorHandle,
      "exclusive content",
      "creator content",
      isNSFW ? "18+" : "safe content",
    ],
  })
}

export function generateProfileMetadata({
  handle,
  displayName,
  bio,
  avatarUrl,
  followersCount,
  isCreator,
  noIndex = false,
  locale = defaultLocale,
}: {
  handle: string
  displayName: string
  bio?: string
  avatarUrl?: string
  followersCount?: number
  isCreator?: boolean
  noIndex?: boolean
  locale?: string
}) {
  const baseUrl = DEFAULT_SEO.siteUrl
  const profileUrl = `${baseUrl}/${locale}/${handle}`
  const name = displayName || handle
  const description = bio || `Check out ${name}'s exclusive content on Fantikx. ${isCreator ? "Creator profile." : ""}`

  return generateSEOMetadata({
    title: `${name} (@${handle})`,
    description,
    image: avatarUrl,
    url: profileUrl,
    type: "profile",
    noIndex,
    locale,
    keywords: [name, handle, "Fantikx", "creator", "exclusive content", followersCount ? "popular creator" : ""],
  })
}

// ============================================
// DYNAMIC STRUCTURED DATA GENERATORS (JSON-LD)
// ============================================

/**
 * Generate Organization Schema for global site
 */
export function generateOrganizationSchema() {
  const baseUrl = DEFAULT_SEO.siteUrl
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: DEFAULT_SEO.siteName,
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/logo.png`,
      width: 512,
      height: 512,
    },
    sameAs: [
      `https://twitter.com/fantikx`,
      `https://instagram.com/fantikx`,
      `https://tiktok.com/@fantikx`,
      `https://t.me/fantikx`,
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@fantikx.com",
      contactType: "customer service",
    },
  }
}

/**
 * Generate WebSite Schema with SearchAction for Google Sitelinks
 */
export function generateWebsiteSchema() {
  const baseUrl = DEFAULT_SEO.siteUrl
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    name: DEFAULT_SEO.siteName,
    url: baseUrl,
    description: DEFAULT_SEO.description,
    publisher: { "@id": `${baseUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/en/discover?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

/**
 * Generate BreadcrumbList Schema for navigation
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  const baseUrl = DEFAULT_SEO.siteUrl
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 2,
        name: item.name,
        item: item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`,
      })),
    ],
  }
}

/**
 * Generate Person Schema for creator profiles
 */
export function generatePersonSchema({
  handle,
  displayName,
  bio,
  avatarUrl,
  followersCount,
  isCreator,
}: {
  handle: string
  displayName: string
  bio?: string
  avatarUrl?: string
  followersCount?: number
  isCreator?: boolean
}) {
  const baseUrl = DEFAULT_SEO.siteUrl
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${baseUrl}/en/${handle}#person`,
    name: displayName || handle,
    alternateName: `@${handle}`,
    url: `${baseUrl}/en/${handle}`,
    image: avatarUrl,
    description: bio,
    ...(followersCount && {
      interactionStatistic: {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/FollowAction",
        userInteractionCount: followersCount,
      },
    }),
    ...(isCreator && { jobTitle: "Content Creator" }),
  }
}

/**
 * Generate VideoObject Schema for video posts
 */
export function generateVideoSchema({
  id,
  title,
  description,
  thumbnailUrl,
  videoUrl,
  duration,
  uploadDate,
  creatorName,
  creatorHandle,
  viewCount,
  likeCount,
  isNSFW,
}: {
  id: string
  title: string
  description: string
  thumbnailUrl?: string
  videoUrl: string
  duration?: number
  uploadDate: string
  creatorName: string
  creatorHandle: string
  viewCount?: number
  likeCount?: number
  isNSFW?: boolean
}) {
  const baseUrl = DEFAULT_SEO.siteUrl
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "@id": `${baseUrl}/en/post/${id}#video`,
    name: title,
    description,
    thumbnailUrl: thumbnailUrl ? [thumbnailUrl] : [`${baseUrl}/og-image.png`],
    contentUrl: videoUrl,
    embedUrl: `${baseUrl}/en/post/${id}`,
    uploadDate,
    ...(duration && {
      duration: `PT${Math.floor(duration / 60)}M${duration % 60}S`,
    }),
    interactionStatistic: [
      ...(viewCount ? [{
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/WatchAction",
        userInteractionCount: viewCount,
      }] : []),
      ...(likeCount ? [{
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: likeCount,
      }] : []),
    ],
    author: {
      "@type": "Person",
      name: creatorName,
      url: `${baseUrl}/en/${creatorHandle}`,
    },
    publisher: {
      "@type": "Organization",
      name: DEFAULT_SEO.siteName,
      logo: { "@type": "ImageObject", url: `${baseUrl}/logo.png` },
    },
    isFamilyFriendly: !isNSFW,
  }
}

/**
 * Generate FAQPage Schema for help/FAQ pages
 */
export function generateFAQSchema(questions: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map(q => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  }
}

/**
 * Generate Product Schema for paid/premium content
 */
export function generateProductSchema({
  id,
  title,
  description,
  price,
  currency = "EUR",
  thumbnailUrl,
  creatorName,
}: {
  id: string
  title: string
  description: string
  price: number
  currency?: string
  thumbnailUrl?: string
  creatorName: string
}) {
  const baseUrl = DEFAULT_SEO.siteUrl
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${baseUrl}/en/post/${id}#product`,
    name: title,
    description,
    image: thumbnailUrl,
    brand: {
      "@type": "Organization",
      name: DEFAULT_SEO.siteName,
    },
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
      seller: { "@type": "Person", name: creatorName },
    },
  }
}

/**
 * Generate SocialMediaPosting Schema for posts
 */
export function generateSocialPostSchema({
  id,
  caption,
  thumbnailUrl,
  createdAt,
  creatorName,
  creatorHandle,
  likesCount,
  commentsCount,
}: {
  id: string
  caption: string
  thumbnailUrl?: string
  createdAt: string
  creatorName: string
  creatorHandle: string
  likesCount?: number
  commentsCount?: number
}) {
  const baseUrl = DEFAULT_SEO.siteUrl
  return {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    "@id": `${baseUrl}/en/post/${id}#post`,
    headline: caption?.slice(0, 110),
    articleBody: caption,
    image: thumbnailUrl,
    datePublished: createdAt,
    author: {
      "@type": "Person",
      name: creatorName,
      url: `${baseUrl}/en/${creatorHandle}`,
    },
    publisher: {
      "@type": "Organization",
      name: DEFAULT_SEO.siteName,
      url: baseUrl,
    },
    mainEntityOfPage: `${baseUrl}/en/post/${id}`,
    interactionStatistic: [
      ...(likesCount ? [{
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: likesCount,
      }] : []),
      ...(commentsCount ? [{
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: commentsCount,
      }] : []),
    ],
  }
}

/**
 * Generate BroadcastEvent Schema for live streams
 * Helps with Google Live Results and social discovery
 */
export function generateLiveStreamSchema({
  id,
  title,
  description,
  thumbnailUrl,
  streamUrl,
  startDate,
  endDate,
  isLive,
  viewerCount,
  creatorName,
  creatorHandle,
  category,
}: {
  id: string
  title: string
  description?: string
  thumbnailUrl?: string
  streamUrl?: string
  startDate: string
  endDate?: string
  isLive: boolean
  viewerCount?: number
  creatorName: string
  creatorHandle: string
  category?: string
}) {
  const baseUrl = DEFAULT_SEO.siteUrl
  const pageUrl = `${baseUrl}/en/live/${id}`

  return {
    "@context": "https://schema.org",
    "@type": "BroadcastEvent",
    "@id": `${pageUrl}#broadcast`,
    name: title,
    description: description || `Live stream by ${creatorName} on Fantikx`,
    startDate,
    ...(endDate && { endDate }),
    isLiveBroadcast: isLive,
    broadcastOfEvent: {
      "@type": "Event",
      name: title,
      startDate,
      ...(endDate && { endDate }),
      eventStatus: isLive
        ? "https://schema.org/EventScheduled"
        : "https://schema.org/EventEnded",
      eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
      location: {
        "@type": "VirtualLocation",
        url: pageUrl,
      },
      performer: {
        "@type": "Person",
        name: creatorName,
        url: `${baseUrl}/en/${creatorHandle}`,
      },
      organizer: {
        "@type": "Organization",
        name: DEFAULT_SEO.siteName,
        url: baseUrl,
      },
      image: thumbnailUrl || `${baseUrl}/og-image.png`,
      ...(category && { about: { "@type": "Thing", name: category } }),
    },
    ...(streamUrl && {
      videoFormat: "https://schema.org/VideoObject",
      publishedOn: {
        "@type": "BroadcastService",
        name: DEFAULT_SEO.siteName,
        url: baseUrl,
      },
    }),
    ...(viewerCount && {
      interactionStatistic: {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/WatchAction",
        userInteractionCount: viewerCount,
      },
    }),
    broadcaster: {
      "@type": "Organization",
      name: DEFAULT_SEO.siteName,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
  }
}

/**
 * Generate Event Schema for upcoming live streams
 */
export function generateUpcomingStreamSchema({
  id,
  title,
  description,
  thumbnailUrl,
  scheduledStart,
  creatorName,
  creatorHandle,
}: {
  id: string
  title: string
  description?: string
  thumbnailUrl?: string
  scheduledStart: string
  creatorName: string
  creatorHandle: string
}) {
  const baseUrl = DEFAULT_SEO.siteUrl
  const pageUrl = `${baseUrl}/en/live/${id}`

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": `${pageUrl}#event`,
    name: title,
    description: description || `Upcoming live stream by ${creatorName}`,
    startDate: scheduledStart,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: {
      "@type": "VirtualLocation",
      url: pageUrl,
    },
    image: thumbnailUrl || `${baseUrl}/og-image.png`,
    performer: {
      "@type": "Person",
      name: creatorName,
      url: `${baseUrl}/en/${creatorHandle}`,
    },
    organizer: {
      "@type": "Organization",
      name: DEFAULT_SEO.siteName,
      url: baseUrl,
      logo: `${baseUrl}/logo.png`,
    },
    offers: {
      "@type": "Offer",
      url: pageUrl,
      price: "0",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString(),
    },
  }
}
