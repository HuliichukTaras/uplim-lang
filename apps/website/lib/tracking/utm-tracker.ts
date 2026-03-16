"use client"

/**
 * UTM Tracking Utilities
 * Generates UTM-tagged URLs for social sharing to track traffic sources
 */

export type SocialPlatform =
    | "twitter"
    | "facebook"
    | "telegram"
    | "whatsapp"
    | "reddit"
    | "copy"
    | "email"
    | "instagram"
    | "tiktok"
    | "threads"

interface UTMParams {
    source: string
    medium: string
    campaign?: string
    content?: string
    term?: string
}

/**
 * Generate URL with UTM parameters
 */
export function addUTMParams(url: string, params: UTMParams): string {
    const urlObj = new URL(url)

    urlObj.searchParams.set("utm_source", params.source)
    urlObj.searchParams.set("utm_medium", params.medium)

    if (params.campaign) {
        urlObj.searchParams.set("utm_campaign", params.campaign)
    }
    if (params.content) {
        urlObj.searchParams.set("utm_content", params.content)
    }
    if (params.term) {
        urlObj.searchParams.set("utm_term", params.term)
    }

    return urlObj.toString()
}

/**
 * Generate share URL with platform-specific UTM tags
 */
export function generateShareUrl(
    baseUrl: string,
    platform: SocialPlatform,
    options?: {
        campaign?: string
        contentId?: string
        creatorHandle?: string
    }
): string {
    const platformConfig: Record<SocialPlatform, UTMParams> = {
        twitter: { source: "twitter", medium: "social" },
        facebook: { source: "facebook", medium: "social" },
        telegram: { source: "telegram", medium: "social" },
        whatsapp: { source: "whatsapp", medium: "social" },
        reddit: { source: "reddit", medium: "social" },
        email: { source: "email", medium: "email" },
        copy: { source: "link", medium: "referral" },
        instagram: { source: "instagram", medium: "social" },
        tiktok: { source: "tiktok", medium: "social" },
        threads: { source: "threads", medium: "social" },
    }

    const params = platformConfig[platform]

    return addUTMParams(baseUrl, {
        ...params,
        campaign: options?.campaign || "share",
        content: options?.contentId,
        term: options?.creatorHandle,
    })
}

/**
 * Generate platform-specific share links with UTM tracking
 */
export function generatePlatformShareLinks(postUrl: string, postTitle: string, creatorHandle?: string) {
    const trackedUrl = (platform: SocialPlatform) =>
        generateShareUrl(postUrl, platform, { creatorHandle })

    return {
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(trackedUrl("twitter"))}&text=${encodeURIComponent(postTitle)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(trackedUrl("facebook"))}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(trackedUrl("telegram"))}&text=${encodeURIComponent(postTitle)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(`${postTitle} ${trackedUrl("whatsapp")}`)}`,
        reddit: `https://reddit.com/submit?url=${encodeURIComponent(trackedUrl("reddit"))}&title=${encodeURIComponent(postTitle)}`,
        email: `mailto:?subject=${encodeURIComponent(postTitle)}&body=${encodeURIComponent(trackedUrl("email"))}`,
        copy: trackedUrl("copy"),
    }
}

/**
 * Capture and store referrer data for analytics
 */
export function captureReferrer(): {
    source: string | null
    medium: string | null
    campaign: string | null
    referrer: string
} | null {
    if (typeof window === "undefined") return null

    const url = new URL(window.location.href)

    return {
        source: url.searchParams.get("utm_source"),
        medium: url.searchParams.get("utm_medium"),
        campaign: url.searchParams.get("utm_campaign"),
        referrer: document.referrer || "direct",
    }
}

/**
 * Get traffic source from referrer URL
 */
export function getReferrerSource(referrer: string): string {
    if (!referrer) return "direct"

    try {
        const url = new URL(referrer)
        const host = url.hostname.toLowerCase()

        const sources: Record<string, string> = {
            "t.co": "twitter",
            "twitter.com": "twitter",
            "x.com": "twitter",
            "facebook.com": "facebook",
            "fb.com": "facebook",
            "instagram.com": "instagram",
            "tiktok.com": "tiktok",
            "telegram.org": "telegram",
            "t.me": "telegram",
            "reddit.com": "reddit",
            "google.com": "google",
            "bing.com": "bing",
            "youtube.com": "youtube",
        }

        for (const [domain, source] of Object.entries(sources)) {
            if (host.includes(domain)) {
                return source
            }
        }

        return host
    } catch {
        return "unknown"
    }
}
