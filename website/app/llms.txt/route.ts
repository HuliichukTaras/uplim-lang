import { NextResponse } from "next/server"
import { locales, defaultLocale } from "@/i18n/config"

export const dynamic = "force-dynamic"

export async function GET() {
  let baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://fantikx.com").replace(/\/$/, "")
  if (!baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`
  }

  const siteName = "Fantikx"
  const siteDescription =
    "Safe Creator Social Network - Create, share, and unlock premium content with integrated monetization"
  const contactEmail = process.env.CONTACT_EMAIL || "support@fantikx.com"
  const defaultLanguage = defaultLocale
  const sitemapUrl = `${baseUrl}/sitemap.xml`
  const robotsUrl = `${baseUrl}/robots.txt`

  const supportedLanguages = locales.join(", ")

  // Public routes (accessible without auth)
  const publicRoutes = [
    "/",
    "/feed",
    "/discover",
    "/profile/[username]",
    "/post/[id]",
    "/legal/terms",
    "/legal/privacy",
    "/legal/cookie-policy",
    "/legal/community-guidelines",
    "/auth/login",
    "/auth/signup",
  ]

  // Protected routes (require authentication)
  const protectedRoutes = [
    "/dashboard",
    "/messages",
    "/upload",
    "/wallet",
    "/settings",
    "/notifications",
    "/favorites",
    "/live",
    "/promote", // Added promote route
  ]

  // Public API endpoints
  const publicApiEndpoints = [
    "GET /api/og - Open Graph image generation",
    "GET /api/recommendations/feed - Public feed recommendations",
    "GET /api/livestream/active - Active livestreams",
  ]

  // Restricted API endpoints (require auth)
  const restrictedApiEndpoints = [
    "/api/upload/* - File upload endpoints (Vercel Blob integration)",
    "/api/wallet/* - Wallet operations (FANTIKX COINS system)",
    "/api/stripe/* - Payment processing (Stripe integration)",
    "/api/messages/* - Messaging system",
    "/api/notifications/* - Notification system",
    "/api/follow - Follow/unfollow users",
    "/api/posts/* - Post management",
    "/api/moderation/* - AI content moderation (Google Cloud Vision API)",
  ]

  const contentTypes = [
    "Images (JPEG, PNG, WebP, GIF) - up to 10 per post",
    "Videos (MP4, WebM, MOV) - up to 3 per post, max 100MB each",
    "Livestreams - real-time video streaming",
    "Text posts with captions and hashtags",
    "Monetized/Premium content - pay-per-unlock or subscription",
    "18+ age-restricted content (with automatic AI detection and verification)",
  ]

  const features = [
    "Content monetization for creators with 80/20 revenue split",
    "FANTIKX COINS virtual currency (1€ = 10 coins)",
    "Subscription-based content access with monthly billing",
    "Digital wallet with top-up (+10% fee) and withdrawal",
    "Real-time messaging between users",
    "Live streaming capabilities with viewer counts",
    "AI-powered content moderation (automatic 18+ detection)",
    "Multi-language support (12 languages: EN, UK, RU, DE, ES, FR, PT, JA, KO, TR, ZH, IT)",
    "Stripe payment integration for secure transactions",
    "Quest system - unlock content through engagement",
    "Promotional ads system (Beta) for creators",
    "Google OAuth authentication",
    "Responsive design - mobile-first UI",
  ]

  const monetizationModel = [
    "Platform fee: 15% minimum from all transactions",
    "Top-up fee: +10% on all wallet deposits",
    "Creator earnings: 80% of content unlock prices",
    "Subscription pricing: Set by creators (monthly recurring)",
    "Micro-transactions: Pay-per-content unlock",
  ]

  const technicalStack = [
    "Framework: Next.js 14+ with App Router",
    "Database: Supabase (PostgreSQL)",
    "Storage: Vercel Blob",
    "Payments: Stripe",
    "AI Moderation: Google Cloud Vision API",
    "Authentication: Supabase Auth with Google OAuth",
    "Internationalization: next-intl",
    "Styling: Tailwind CSS v4",
  ]

  const llmContent = `# ${siteName} - LLM Metadata
# Generated: ${new Date().toISOString()}
# This file provides structured information for LLMs and AI assistants

## Site Information
site_name: ${siteName}
site_url: ${baseUrl}
description: ${siteDescription}
contact: ${contactEmail}
default_language: ${defaultLanguage}
supported_languages: ${supportedLanguages}
platform_type: Social Network, Content Monetization Platform
target_audience: Content Creators, Digital Artists, Influencers
age_restriction: 18+ content allowed with verification

## Important URLs
sitemap: ${sitemapUrl}
robots: ${robotsUrl}
homepage: ${baseUrl}
feed: ${baseUrl}/en/feed
discover: ${baseUrl}/en/discover
login: ${baseUrl}/en/auth/login
signup: ${baseUrl}/en/auth/signup

## Public Routes (No Authentication Required)
${publicRoutes.map((route) => `- ${route}`).join("\n")}

## Protected Routes (Authentication Required)
${protectedRoutes.map((route) => `- ${route}`).join("\n")}

## Public API Endpoints
${publicApiEndpoints.map((endpoint) => `- ${endpoint}`).join("\n")}

## Restricted API Endpoints (Authentication Required)
${restrictedApiEndpoints.map((endpoint) => `- ${endpoint}`).join("\n")}

## Supported Content Types
${contentTypes.map((type) => `- ${type}`).join("\n")}

## Platform Features
${features.map((feature) => `- ${feature}`).join("\n")}

## Monetization Model
${monetizationModel.map((item) => `- ${item}`).join("\n")}

## Technical Stack
${technicalStack.map((tech) => `- ${tech}`).join("\n")}

## Crawling Guidelines
- Respect robots.txt directives
- Do not crawl protected/authenticated routes
- Rate limit requests to avoid overloading servers (max 1 request per second recommended)
- Do not index or store 18+ content without proper age verification
- Respect user privacy - do not scrape personal information
- Use sitemap.xml for efficient discovery of public content
- Only crawl during off-peak hours (00:00-06:00 UTC preferred)
- Identify your bot with a proper User-Agent header

## Data Usage Policy
- Public profiles and posts may be indexed for search purposes
- Private content requires explicit user consent
- Payment and wallet data is strictly private and encrypted
- Message content is end-to-end encrypted and private
- User analytics data is anonymized and aggregated
- User-generated content is protected by DMCA
- Respect copyright and intellectual property rights

## Content Moderation
- AI-powered automatic detection of adult content
- Manual review system for flagged content
- Community reporting mechanism
- DMCA takedown process available
- Zero tolerance for illegal content

## Accessibility
- WCAG 2.1 Level AA compliant
- Keyboard navigation support
- Screen reader optimized
- Multilingual interface (12 languages)
- Responsive design for all devices

## Contact
General inquiries: ${contactEmail}
Abuse reports: abuse@fantikx.com
DMCA/Copyright: legal@fantikx.com
Partnership opportunities: partnerships@fantikx.com
Technical support: support@fantikx.com

## Legal
Terms of Service: ${baseUrl}/en/legal/terms
Privacy Policy: ${baseUrl}/en/legal/privacy
Cookie Policy: ${baseUrl}/en/legal/cookie-policy
Community Guidelines: ${baseUrl}/en/legal/community-guidelines

## AI Bot Access
- All major AI crawlers are welcome (GPTBot, Claude, Gemini, etc.)
- Full access to public content for training and indexing
- Respect rate limits and crawl responsibly
- See robots.txt for specific bot rules

## Last Updated
${new Date().toISOString()}
`

  return new NextResponse(llmContent, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
