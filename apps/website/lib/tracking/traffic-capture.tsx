"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

/**
 * White-Hat Traffic Capture System
 * 
 * Captures and tracks traffic from:
 * - Search engines (Google, Bing, Yandex, Baidu, DuckDuckGo)
 * - AI Assistants (ChatGPT, Claude, Perplexity, Gemini)
 * - Social Networks (Instagram, TikTok, X/Twitter, Facebook, Telegram)
 * - Direct/Referral traffic
 * 
 * 100% White-hat approach - only standard analytics and tracking
 */

export type TrafficSource =
    | "google" | "bing" | "yandex" | "baidu" | "duckduckgo" | "yahoo"
    | "chatgpt" | "claude" | "perplexity" | "gemini" | "copilot"
    | "instagram" | "tiktok" | "twitter" | "facebook" | "telegram" | "threads" | "youtube"
    | "direct" | "referral" | "email" | "unknown"

export type TrafficMedium = "organic" | "social" | "ai" | "referral" | "direct" | "paid" | "email"

interface TrafficData {
    source: TrafficSource
    medium: TrafficMedium
    campaign: string | null
    referrer: string
    landingPage: string
    timestamp: number
    sessionId: string
    utmSource: string | null
    utmMedium: string | null
    utmCampaign: string | null
    utmContent: string | null
    utmTerm: string | null
}

// Detect source from referrer URL
function detectSourceFromReferrer(referrer: string): { source: TrafficSource; medium: TrafficMedium } {
    if (!referrer) return { source: "direct", medium: "direct" }

    const url = referrer.toLowerCase()

    // Search Engines
    if (url.includes("google.")) return { source: "google", medium: "organic" }
    if (url.includes("bing.")) return { source: "bing", medium: "organic" }
    if (url.includes("yandex.")) return { source: "yandex", medium: "organic" }
    if (url.includes("baidu.")) return { source: "baidu", medium: "organic" }
    if (url.includes("duckduckgo.")) return { source: "duckduckgo", medium: "organic" }
    if (url.includes("yahoo.")) return { source: "yahoo", medium: "organic" }

    // AI Assistants
    if (url.includes("chat.openai.") || url.includes("chatgpt.com")) return { source: "chatgpt", medium: "ai" }
    if (url.includes("claude.ai") || url.includes("anthropic.")) return { source: "claude", medium: "ai" }
    if (url.includes("perplexity.")) return { source: "perplexity", medium: "ai" }
    if (url.includes("gemini.google.") || url.includes("bard.google.")) return { source: "gemini", medium: "ai" }
    if (url.includes("copilot.microsoft.")) return { source: "copilot", medium: "ai" }

    // Social Networks
    if (url.includes("instagram.") || url.includes("l.instagram.")) return { source: "instagram", medium: "social" }
    if (url.includes("tiktok.")) return { source: "tiktok", medium: "social" }
    if (url.includes("twitter.") || url.includes("t.co") || url.includes("x.com")) return { source: "twitter", medium: "social" }
    if (url.includes("facebook.") || url.includes("fb.com") || url.includes("l.facebook.")) return { source: "facebook", medium: "social" }
    if (url.includes("telegram.") || url.includes("t.me")) return { source: "telegram", medium: "social" }
    if (url.includes("threads.net")) return { source: "threads", medium: "social" }
    if (url.includes("youtube.") || url.includes("youtu.be")) return { source: "youtube", medium: "social" }

    return { source: "referral", medium: "referral" }
}

// Generate session ID
function getSessionId(): string {
    if (typeof window === "undefined") return ""

    let sessionId = sessionStorage.getItem("fantikx_session_id")
    if (!sessionId) {
        sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
        sessionStorage.setItem("fantikx_session_id", sessionId)
    }
    return sessionId
}

// Capture traffic data
export function captureTrafficData(): TrafficData | null {
    if (typeof window === "undefined") return null

    const url = new URL(window.location.href)
    const referrer = document.referrer
    const { source, medium } = detectSourceFromReferrer(referrer)

    // Override with UTM if present
    const utmSource = url.searchParams.get("utm_source")
    const utmMedium = url.searchParams.get("utm_medium")

    const finalSource = (utmSource as TrafficSource) || source
    const finalMedium = (utmMedium as TrafficMedium) || medium

    return {
        source: finalSource,
        medium: finalMedium,
        campaign: url.searchParams.get("utm_campaign"),
        referrer,
        landingPage: url.pathname,
        timestamp: Date.now(),
        sessionId: getSessionId(),
        utmSource,
        utmMedium,
        utmCampaign: url.searchParams.get("utm_campaign"),
        utmContent: url.searchParams.get("utm_content"),
        utmTerm: url.searchParams.get("utm_term"),
    }
}

// Store traffic data for analytics
export function storeTrafficData(data: TrafficData): void {
    if (typeof window === "undefined") return

    // Store in localStorage for persistence
    const key = `fantikx_traffic_${data.sessionId}`
    const existingData = localStorage.getItem(key)

    if (!existingData) {
        localStorage.setItem(key, JSON.stringify(data))

        // Push to dataLayer for GTM/GA4
        if (typeof window !== "undefined" && (window as any).dataLayer) {
            (window as any).dataLayer.push({
                event: "traffic_capture",
                traffic_source: data.source,
                traffic_medium: data.medium,
                traffic_campaign: data.campaign,
                landing_page: data.landingPage,
                referrer: data.referrer,
            })
        }

        // Send to GA4 with custom dimensions
        sendGA4TrafficEvent(data)
    }
}

/**
 * Send traffic data to GA4 with custom dimensions
 * Requires gtag to be loaded on the page
 */
export function sendGA4TrafficEvent(data: TrafficData): void {
    if (typeof window === "undefined") return

    const gtag = (window as any).gtag
    if (!gtag) return

    // Set user properties for persistent tracking
    gtag("set", "user_properties", {
        traffic_source: data.source,
        traffic_medium: data.medium,
        first_visit_source: data.source,
    })

    // Send custom event with all dimensions
    gtag("event", "traffic_source_captured", {
        // Custom dimensions (need to be configured in GA4)
        source: data.source,
        medium: data.medium,
        campaign: data.campaign || "(not set)",
        landing_page: data.landingPage,
        referrer_domain: data.referrer ? new URL(data.referrer).hostname : "direct",
        session_id: data.sessionId,
        // Standard parameters
        page_location: window.location.href,
        page_title: document.title,
    })

    // Track source-specific events for better segmentation
    if (data.medium === "ai") {
        gtag("event", "ai_traffic", {
            ai_platform: data.source,
            landing_page: data.landingPage,
        })
    } else if (data.medium === "social") {
        gtag("event", "social_traffic", {
            social_network: data.source,
            landing_page: data.landingPage,
        })
    } else if (data.medium === "organic") {
        gtag("event", "organic_traffic", {
            search_engine: data.source,
            landing_page: data.landingPage,
        })
    }
}

// Get stored traffic source for current session
export function getStoredTrafficSource(): TrafficData | null {
    if (typeof window === "undefined") return null

    const sessionId = getSessionId()
    const key = `fantikx_traffic_${sessionId}`
    const data = localStorage.getItem(key)

    return data ? JSON.parse(data) : null
}

/**
 * React hook to capture and track traffic
 */
export function useTrafficCapture() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        const data = captureTrafficData()
        if (data) {
            storeTrafficData(data)
        }
    }, [pathname, searchParams])
}

/**
 * Traffic Capture Provider Component
 * Add this to your root layout to automatically capture all traffic
 */
export function TrafficCaptureProvider({ children }: { children: React.ReactNode }) {
    useTrafficCapture()
    return <>{ children } </>
}

/**
 * Generate optimized links for sharing on different platforms
 * These links include proper UTM parameters for tracking
 */
export function generateOptimizedShareLinks(pageUrl: string, title: string) {
    const encodeUrl = (url: string) => encodeURIComponent(url)
    const encodeText = (text: string) => encodeURIComponent(text)

    const withUtm = (platform: string) => {
        const url = new URL(pageUrl)
        url.searchParams.set("utm_source", platform)
        url.searchParams.set("utm_medium", "social")
        url.searchParams.set("utm_campaign", "share")
        return url.toString()
    }

    return {
        // Social Networks
        twitter: `https://twitter.com/intent/tweet?url=${encodeUrl(withUtm("twitter"))}&text=${encodeText(title)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeUrl(withUtm("facebook"))}`,
        telegram: `https://t.me/share/url?url=${encodeUrl(withUtm("telegram"))}&text=${encodeText(title)}`,
        whatsapp: `https://wa.me/?text=${encodeText(`${title} ${withUtm("whatsapp")}`)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeUrl(withUtm("linkedin"))}`,
        reddit: `https://reddit.com/submit?url=${encodeUrl(withUtm("reddit"))}&title=${encodeText(title)}`,
        pinterest: `https://pinterest.com/pin/create/button/?url=${encodeUrl(withUtm("pinterest"))}&description=${encodeText(title)}`,

        // Messaging
        email: `mailto:?subject=${encodeText(title)}&body=${encodeText(withUtm("email"))}`,
        sms: `sms:?body=${encodeText(`${title} ${withUtm("sms")}`)}`,

        // Copy link
        copy: withUtm("link"),
    }
}

/**
 * Get human-readable source name
 */
export function getSourceDisplayName(source: TrafficSource): string {
    const names: Record<TrafficSource, string> = {
        google: "Google Search",
        bing: "Bing Search",
        yandex: "Yandex",
        baidu: "Baidu",
        duckduckgo: "DuckDuckGo",
        yahoo: "Yahoo",
        chatgpt: "ChatGPT",
        claude: "Claude AI",
        perplexity: "Perplexity AI",
        gemini: "Google Gemini",
        copilot: "Microsoft Copilot",
        instagram: "Instagram",
        tiktok: "TikTok",
        twitter: "X (Twitter)",
        facebook: "Facebook",
        telegram: "Telegram",
        threads: "Threads",
        youtube: "YouTube",
        direct: "Direct",
        referral: "Referral",
        email: "Email",
        unknown: "Unknown",
    }
    return names[source] || source
}
