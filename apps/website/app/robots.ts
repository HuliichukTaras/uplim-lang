import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  let baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://fantikx.com").replace(/\/$/, "")
  if (!baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`
  }

  // Private routes that should never be indexed
  const privateRoutes = [
    "/*/auth/*",
    "/*/dashboard",
    "/*/settings",
    "/*/upload",
    "/*/wallet",
    "/*/messages",
    "/*/notifications",
    "/api/*",
    "/_next/*",
    "/private/*",
  ]

  return {
    host: baseUrl,
    rules: [
      // === SEARCH ENGINE BOTS ===
      {
        userAgent: "*",
        allow: ["/"],
        disallow: privateRoutes,
      },
      {
        userAgent: "Googlebot",
        allow: ["/"],
        disallow: privateRoutes,
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/"],
      },
      {
        userAgent: "Googlebot-Video",
        allow: ["/"],
      },
      {
        userAgent: "Bingbot",
        allow: ["/"],
        disallow: privateRoutes,
      },
      {
        userAgent: "Slurp", // Yahoo
        allow: ["/"],
      },
      {
        userAgent: "DuckDuckBot",
        allow: ["/"],
      },
      {
        userAgent: "Baiduspider",
        allow: ["/"],
      },
      {
        userAgent: "YandexBot",
        allow: ["/"],
      },
      {
        userAgent: "Sogou",
        allow: ["/"],
      },
      {
        userAgent: "Applebot",
        allow: ["/"],
      },

      // === AI CRAWLERS (MAXIMUM VISIBILITY) ===
      // OpenAI
      {
        userAgent: "GPTBot",
        allow: ["/"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: ["/"],
      },
      {
        userAgent: "OAI-SearchBot",
        allow: ["/"],
      },
      // Google AI
      {
        userAgent: "Google-Extended",
        allow: ["/"],
      },
      {
        userAgent: "Gemini",
        allow: ["/"],
      },
      // Anthropic
      {
        userAgent: "anthropic-ai",
        allow: ["/"],
      },
      {
        userAgent: "Claude-Web",
        allow: ["/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/"],
      },
      // Meta
      {
        userAgent: "FacebookBot",
        allow: ["/"],
      },
      {
        userAgent: "meta-externalagent",
        allow: ["/"],
      },
      // Perplexity
      {
        userAgent: "PerplexityBot",
        allow: ["/"],
      },
      // Cohere
      {
        userAgent: "cohere-ai",
        allow: ["/"],
      },
      // Microsoft
      {
        userAgent: "Copilot",
        allow: ["/"],
      },
      // Amazon
      {
        userAgent: "Amazonbot",
        allow: ["/"],
      },
      // Apple Intelligence
      {
        userAgent: "Applebot-Extended",
        allow: ["/"],
      },
      // Common Crawl (AI training)
      {
        userAgent: "CCBot",
        allow: ["/"],
      },
      // You.com
      {
        userAgent: "YouBot",
        allow: ["/"],
      },
      // Bytespider (TikTok/ByteDance)
      {
        userAgent: "Bytespider",
        allow: ["/"],
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/video-sitemap.xml`,
      `${baseUrl}/image-sitemap.xml`,
    ],
  }
}
