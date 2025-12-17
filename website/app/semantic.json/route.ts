import { NextResponse } from "next/server"

/**
 * semantic.json - Entity & Relations Graph for AI
 * 
 * Helps LLMs understand site structure better than schema.org alone.
 * Describes entities, relationships, and knowledge graph.
 */

export async function GET() {
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://fantikx.com").replace(/\/$/, "")

    const semanticData = {
        "$schema": "https://schema.org/Graph",
        "version": "1.0",
        "updated": new Date().toISOString(),
        "source": baseUrl,

        // Core entities on the platform
        "entities": {
            "platform": {
                "type": "Organization",
                "name": "Fantikx",
                "description": "Content monetization platform for creators"
            },
            "creator": {
                "type": "Person",
                "description": "User who creates and sells content",
                "properties": ["handle", "display_name", "bio", "avatar", "is_verified", "followers_count"]
            },
            "fan": {
                "type": "Person",
                "description": "User who consumes and purchases content",
                "properties": ["handle", "wallet_balance", "subscriptions"]
            },
            "post": {
                "type": "CreativeWork",
                "subtypes": ["ImageObject", "VideoObject", "SocialMediaPosting"],
                "description": "Content created by creators",
                "properties": ["caption", "media", "price", "likes", "comments", "is_nsfw"]
            },
            "subscription": {
                "type": "Offer",
                "description": "Monthly recurring access to creator content",
                "properties": ["price", "billing_period", "benefits"]
            },
            "live_stream": {
                "type": "BroadcastEvent",
                "description": "Real-time video streaming by creators",
                "properties": ["title", "viewer_count", "is_live", "category"]
            },
            "wallet": {
                "type": "FinancialAccount",
                "description": "Virtual currency account",
                "properties": ["balance", "currency", "transactions"]
            },
            "fantikx_coin": {
                "type": "Currency",
                "description": "Platform virtual currency (€1 = 10 coins)",
                "exchange_rate": { "EUR": 0.1 }
            }
        },

        // Relationships between entities
        "relations": [
            { "subject": "creator", "predicate": "creates", "object": "post" },
            { "subject": "creator", "predicate": "hosts", "object": "live_stream" },
            { "subject": "creator", "predicate": "offers", "object": "subscription" },
            { "subject": "fan", "predicate": "follows", "object": "creator" },
            { "subject": "fan", "predicate": "unlocks", "object": "post" },
            { "subject": "fan", "predicate": "subscribes_to", "object": "subscription" },
            { "subject": "fan", "predicate": "owns", "object": "wallet" },
            { "subject": "wallet", "predicate": "contains", "object": "fantikx_coin" },
            { "subject": "platform", "predicate": "hosts", "object": "creator" },
            { "subject": "platform", "predicate": "hosts", "object": "fan" },
            { "subject": "platform", "predicate": "moderates", "object": "post" }
        ],

        // User journeys / flows
        "user_flows": {
            "creator_onboarding": [
                "signup",
                "verify_identity",
                "complete_profile",
                "upload_content",
                "set_pricing",
                "promote_profile",
                "earn_money",
                "withdraw"
            ],
            "fan_purchase": [
                "signup",
                "browse_creators",
                "top_up_wallet",
                "unlock_content",
                "interact",
                "subscribe"
            ]
        },

        // Key actions available
        "actions": {
            "content": ["create", "upload", "edit", "delete", "unlock", "share"],
            "social": ["follow", "unfollow", "like", "comment", "message"],
            "financial": ["top_up", "purchase", "subscribe", "withdraw", "tip"]
        },

        // Content classification
        "content_taxonomy": {
            "by_type": ["photo", "video", "live_stream", "text"],
            "by_access": ["free", "paid", "subscription_only"],
            "by_rating": ["safe", "suggestive", "adult_18+"],
            "by_status": ["public", "unlisted", "private"]
        },

        // Business model
        "monetization": {
            "revenue_streams": [
                "content_unlocks",
                "subscriptions",
                "tips",
                "live_stream_gifts"
            ],
            "fee_structure": {
                "platform_take": "15%",
                "creator_share": "85%",
                "payment_processing": "included"
            }
        }
    }

    return NextResponse.json(semanticData, {
        headers: {
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
        },
    })
}
