import { NextResponse } from "next/server"

/**
 * policy.json - Machine-Readable Policies
 * 
 * Structured legal & policy data for AI:
 * - Privacy policy summary
 * - Cookie usage
 * - Data processing
 * - Training permissions
 */

export async function GET() {
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://fantikx.com").replace(/\/$/, "")

    const policyData = {
        "$schema": "https://schema.org/WebPage",
        "version": "1.0",
        "updated": new Date().toISOString(),
        "source": baseUrl,

        // Privacy Policy Summary
        "privacy": {
            "full_policy_url": `${baseUrl}/legal/privacy`,
            "data_controller": "Fantikx",
            "contact_email": "privacy@fantikx.com",
            "jurisdiction": "EU",

            "data_collected": {
                "account": ["email", "username", "password_hash"],
                "profile": ["display_name", "bio", "avatar", "country"],
                "content": ["posts", "comments", "messages"],
                "financial": ["payment_method", "transaction_history"],
                "technical": ["ip_address", "device_info", "cookies"]
            },

            "data_usage": {
                "service_provision": true,
                "personalization": true,
                "analytics": true,
                "marketing": "opt-in",
                "third_party_sharing": "limited",
                "ai_training": {
                    "platform_data": true,
                    "user_content": false
                }
            },

            "user_rights": [
                "access",
                "rectification",
                "erasure",
                "portability",
                "restriction",
                "objection"
            ],

            "retention": {
                "account_data": "until_deletion",
                "content": "until_deletion",
                "logs": "90_days",
                "financial": "7_years"
            }
        },

        // Cookie Policy Summary
        "cookies": {
            "full_policy_url": `${baseUrl}/legal/cookies`,

            "categories": {
                "necessary": {
                    "consent_required": false,
                    "examples": ["session", "csrf", "preferences"]
                },
                "analytics": {
                    "consent_required": true,
                    "examples": ["google_analytics", "amplitude"]
                },
                "marketing": {
                    "consent_required": true,
                    "examples": ["facebook_pixel", "google_ads"]
                },
                "functional": {
                    "consent_required": true,
                    "examples": ["language", "theme"]
                }
            },

            "third_party_cookies": [
                { "provider": "Google Analytics", "purpose": "analytics" },
                { "provider": "Stripe", "purpose": "payments" },
                { "provider": "Vercel", "purpose": "hosting" }
            ]
        },

        // Terms Summary
        "terms": {
            "full_policy_url": `${baseUrl}/legal/terms`,

            "user_obligations": [
                "be_18_or_older",
                "provide_accurate_info",
                "not_upload_illegal_content",
                "respect_copyright",
                "not_harass_others"
            ],

            "platform_rights": [
                "moderate_content",
                "suspend_accounts",
                "modify_service",
                "set_fees"
            ],

            "prohibited_content": [
                "illegal_material",
                "non_consensual",
                "minors",
                "violence",
                "fraud",
                "spam"
            ],

            "liability": {
                "platform_liability": "limited",
                "user_content_liability": "user"
            }
        },

        // AI Training Policy
        "ai_training": {
            "platform_content": {
                "allowed": true,
                "includes": ["landing_pages", "help_articles", "faq", "metadata"]
            },
            "user_content": {
                "allowed": false,
                "reason": "User-generated content is protected by copyright and privacy"
            },
            "attribution_required": true,
            "commercial_use": "contact_required"
        },

        // DMCA / Copyright
        "copyright": {
            "dmca_agent": "legal@fantikx.com",
            "takedown_process": "https://fantikx.com/legal/dmca",
            "counter_notice": true,
            "repeat_infringer_policy": true
        },

        // Age Restriction
        "age_restriction": {
            "minimum_age": 18,
            "verification_required": true,
            "adult_content": "allowed",
            "age_gate": true
        }
    }

    return NextResponse.json(policyData, {
        headers: {
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
        },
    })
}
