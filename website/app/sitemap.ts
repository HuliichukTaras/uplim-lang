import type { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"
import { locales, defaultLocale } from "@/i18n/config"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://fantikx.com").replace(/\/$/, "")
  if (!baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`
  }
  const supabase = await createClient()

  // Static public pages - these exist for all locales
  const publicRoutes = [
    "", // homepage/landing
    "/legal/terms",
    "/legal/privacy",
    "/legal/cookies",
    "/legal/moderation",
    "/legal/age-restriction",
    "/about",
    "/contact",
    "/features",
    "/pricing",
    "/help",
    "/faq",
    "/safety",
  ]

  const allRoutes: MetadataRoute.Sitemap = []

  for (const route of publicRoutes) {
    const primaryLocale = defaultLocale
    const path = route === "" ? "" : route

    allRoutes.push({
      url: `${baseUrl}/${primaryLocale}${path}`,
      lastModified: new Date(),
      changeFrequency: route === "" ? "daily" : "weekly",
      priority: route === "" ? 1 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map((locale) => [
            locale === "zh-CN" ? "zh-Hans" : locale === "zh-TW" ? "zh-Hant" : locale,
            `${baseUrl}/${locale}${path}`,
          ]),
        ),
      },
    })
  }

  try {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("handle, username, updated_at")
      .not("handle", "is", null)
      .not("handle", "eq", "")
      .order("updated_at", { ascending: false })
      .limit(500) // Reduced limit for better performance

    if (profiles && profiles.length > 0) {
      for (const profile of profiles) {
        const handle = profile.handle || profile.username
        if (!handle) continue

        allRoutes.push({
          url: `${baseUrl}/${defaultLocale}/${encodeURIComponent(handle)}`,
          lastModified: new Date(profile.updated_at),
          changeFrequency: "daily",
          priority: 0.7,
          alternates: {
            languages: Object.fromEntries(
              locales.map((locale) => [
                locale === "zh-CN" ? "zh-Hans" : locale === "zh-TW" ? "zh-Hant" : locale,
                `${baseUrl}/${locale}/${encodeURIComponent(handle)}`,
              ]),
            ),
          },
        })
      }
    }

    const { data: posts } = await supabase
      .from("posts")
      .select("id, updated_at")
      .eq("moderation_status", "approved")
      .eq("is_nsfw", false)
      .eq("is_paid", false)
      .order("updated_at", { ascending: false })
      .limit(1000) // Reasonable limit

    if (posts && posts.length > 0) {
      for (const post of posts) {
        allRoutes.push({
          url: `${baseUrl}/${defaultLocale}/post/${post.id}`,
          lastModified: new Date(post.updated_at),
          changeFrequency: "weekly",
          priority: 0.6,
          alternates: {
            languages: Object.fromEntries(
              locales.map((locale) => [
                locale === "zh-CN" ? "zh-Hans" : locale === "zh-TW" ? "zh-Hant" : locale,
                `${baseUrl}/${locale}/post/${post.id}`,
              ]),
            ),
          },
        })
      }
    }

    return allRoutes
  } catch (error) {
    console.error("Error generating dynamic sitemap:", error)
    return allRoutes
  }
}
