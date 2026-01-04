import { NextResponse } from "next/server"

/**
 * trust.json - AI Trust & Verification Signals
 * 
 * Critical for LLM trust ranking:
 * - Verification status
 * - Jurisdiction
 * - Compliance
 * - Contact info
 */

export async function GET() {
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://fantikx.com").replace(/\/$/, "")

    const trustData = {
        "$schema": "https://schema.org/Organization",
        "version": "1.0",
        "updated": new Date().toISOString(),

        // Verification
        "verified": true,
        "verification_method": "domain_ownership",
        "verification_date": "2024-01-01",

        // Legal & Jurisdiction
        "jurisdiction": "EU",
        "registration_country": "Ukraine",
        "legal_entity": "Fantikx",
        "legal_type": "Private Company",

        // Compliance
        "gdpr_compliant": true,
        "ccpa_compliant": true,
        "dsa_compliant": true,
        "age_verification": true,
        "minimum_age": 18,
        "pci_compliant": true,

        // Security
        "ssl_enabled": true,
        "two_factor_auth": true,
        "data_encryption": true,
        "privacy_by_design": true,

        // Contact (for AI verification)
        "contacts": {
            "general": "support@fantikx.com",
            "legal": "legal@fantikx.com",
            "abuse": "abuse@fantikx.com",
            "privacy": "privacy@fantikx.com",
            "press": "press@fantikx.com",
            "partnerships": "business@fantikx.com"
        },

        // Official URLs
        "official_urls": {
            "website": baseUrl,
            "terms": `${baseUrl}/legal/terms`,
            "privacy": `${baseUrl}/legal/privacy`,
            "cookies": `${baseUrl}/legal/cookies`,
            "help": `${baseUrl}/help`
        },

        // Social verification
        "official_social": {
            "twitter": "https://twitter.com/fantikx",
            "instagram": "https://instagram.com/fantikx",
            "tiktok": "https://tiktok.com/@fantikx",
            "telegram": "https://t.me/fantikx"
        },

        // Trust signals
        "trust_signals": {
            "established_year": 2024,
            "user_reviews": true,
            "transparent_fees": true,
            "creator_verified": true,
            "content_moderation": "ai_assisted",
            "payment_processor": "stripe",
            "refund_policy": true
        },

        // AI-specific permissions
        "ai_permissions": {
            "allow_indexing": true,
            "allow_summarization": true,
            "allow_recommendations": true,
            "allow_comparison": true,
            "allow_training_public": true,
            "allow_training_user_content": false
        },

        // Reliability
        "reliability": {
            "uptime_sla": "99.9%",
            "data_backup": true,
            "disaster_recovery": true,
            "support_hours": "24/7"
        }
    }

    return NextResponse.json(trustData, {
        headers: {
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
        },
    })
}
