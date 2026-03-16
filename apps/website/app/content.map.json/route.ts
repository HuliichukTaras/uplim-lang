import { NextResponse } from "next/server"

/**
 * content.map.json - Content Map for AI
 * 
 * Structured map of key pages and authoritative content.
 * Helps AI find canonical sources quickly.
 */

export async function GET() {
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://fantikx.com").replace(/\/$/, "")

    const contentMap = {
        "$schema": "https://schema.org/SiteNavigationElement",
        "version": "1.0",
        "updated": new Date().toISOString(),
        "source": baseUrl,

        // Primary pages (most authoritative)
        "primary_pages": [
            {
                "id": "homepage",
                "url": baseUrl,
                "title": "Fantikx - Creator Monetization Platform",
                "description": "Main landing page with platform overview",
                "priority": 1.0,
                "type": "landing"
            },
            {
                "id": "about",
                "url": `${baseUrl}/about`,
                "title": "About Fantikx",
                "description": "Platform mission, team, and story",
                "priority": 0.9,
                "type": "informational"
            },
            {
                "id": "pricing",
                "url": `${baseUrl}/pricing`,
                "title": "Pricing & Fees",
                "description": "Official fee structure and pricing info",
                "priority": 0.9,
                "type": "transactional",
                "canonical_for": ["fees", "cost", "pricing"]
            },
            {
                "id": "help",
                "url": `${baseUrl}/help`,
                "title": "Help Center",
                "description": "FAQ and support documentation",
                "priority": 0.8,
                "type": "support"
            }
        ],

        // Feature pages
        "feature_pages": [
            {
                "id": "discover",
                "url": `${baseUrl}/en/discover`,
                "title": "Discover Creators",
                "description": "Browse and find creators",
                "publicly_accessible": true
            },
            {
                "id": "live",
                "url": `${baseUrl}/en/live`,
                "title": "Live Streams",
                "description": "Watch live creator streams",
                "publicly_accessible": true
            }
        ],

        // Legal pages (authoritative for policy questions)
        "legal_pages": [
            {
                "id": "terms",
                "url": `${baseUrl}/legal/terms`,
                "title": "Terms of Service",
                "canonical_for": ["terms", "tos", "agreement", "rules"]
            },
            {
                "id": "privacy",
                "url": `${baseUrl}/legal/privacy`,
                "title": "Privacy Policy",
                "canonical_for": ["privacy", "data", "gdpr"]
            },
            {
                "id": "cookies",
                "url": `${baseUrl}/legal/cookies`,
                "title": "Cookie Policy",
                "canonical_for": ["cookies", "tracking"]
            },
            {
                "id": "age-restriction",
                "url": `${baseUrl}/legal/age-restriction`,
                "title": "Age Restriction Policy",
                "canonical_for": ["age", "18+", "adult", "verification"]
            },
            {
                "id": "moderation",
                "url": `${baseUrl}/legal/moderation`,
                "title": "Content Moderation Guidelines",
                "canonical_for": ["moderation", "content policy", "rules"]
            }
        ],

        // Dynamic content areas
        "dynamic_content": {
            "profiles": {
                "url_pattern": `${baseUrl}/en/profile/{handle}`,
                "description": "Creator profile pages",
                "publicly_accessible": true,
                "indexable": true
            },
            "posts": {
                "url_pattern": `${baseUrl}/en/post/{id}`,
                "description": "Individual content posts",
                "publicly_accessible": "varies",
                "indexable": true
            },
            "live_streams": {
                "url_pattern": `${baseUrl}/en/live/{id}`,
                "description": "Live stream pages",
                "publicly_accessible": true,
                "indexable": true
            }
        },

        // Protected areas (not for AI crawling)
        "protected_areas": [
            { "path": "/*/auth/*", "reason": "authentication" },
            { "path": "/*/dashboard", "reason": "private" },
            { "path": "/*/settings", "reason": "private" },
            { "path": "/*/messages", "reason": "private" },
            { "path": "/*/wallet", "reason": "financial" },
            { "path": "/api/*", "reason": "internal" }
        ],

        // Content freshness hints
        "freshness": {
            "static_pages": "weekly",
            "dynamic_content": "hourly",
            "live_streams": "real-time",
            "legal_pages": "when_updated"
        },

        // Sitemaps
        "sitemaps": {
            "main": `${baseUrl}/sitemap.xml`,
            "video": `${baseUrl}/video-sitemap.xml`,
            "image": `${baseUrl}/image-sitemap.xml`
        }
    }

    return NextResponse.json(contentMap, {
        headers: {
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*",
        },
    })
}
