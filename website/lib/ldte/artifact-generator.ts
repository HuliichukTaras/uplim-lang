/**
 * Light Digital Trail Engine - Artifact Generator
 * 
 * Server-side event handlers that create/update public artifacts
 * when users perform actions. GDPR-safe, no tracking.
 * 
 * "user action → public FanTikX object → passive spread"
 */

import { revalidatePath, revalidateTag } from "next/cache"

// Event types that trigger artifact generation
export type ArtifactEvent =
    | { type: "post.created"; postId: string; userId: string }
    | { type: "post.updated"; postId: string }
    | { type: "post.deleted"; postId: string }
    | { type: "profile.updated"; userId: string; handle: string }
    | { type: "badge.earned"; userId: string; badgeId: string }
    | { type: "unlock.completed"; postId: string }
    | { type: "subscription.created"; creatorId: string }
    | { type: "live.started"; streamId: string; userId: string }
    | { type: "live.ended"; streamId: string }

/**
 * Main artifact generation handler
 * Call this after any user action that creates public content
 */
export async function onArtifactEvent(event: ArtifactEvent): Promise<void> {
    console.log(`[LDTE] Processing event: ${event.type}`)

    switch (event.type) {
        case "post.created":
            await handlePostCreated(event)
            break
        case "post.updated":
            await handlePostUpdated(event)
            break
        case "post.deleted":
            await handlePostDeleted(event)
            break
        case "profile.updated":
            await handleProfileUpdated(event)
            break
        case "badge.earned":
            await handleBadgeEarned(event)
            break
        case "unlock.completed":
            await handleUnlockCompleted(event)
            break
        case "subscription.created":
            await handleSubscriptionCreated(event)
            break
        case "live.started":
            await handleLiveStarted(event)
            break
        case "live.ended":
            await handleLiveEnded(event)
            break
    }
}

// === EVENT HANDLERS ===

async function handlePostCreated(event: { type: "post.created"; postId: string; userId: string }) {
    // Revalidate post page (triggers OG regeneration)
    revalidatePath(`/[locale]/post/${event.postId}`)

    // Revalidate sitemap
    revalidateTag("sitemap")
    revalidateTag("video-sitemap")
    revalidateTag("image-sitemap")

    // Revalidate profile (post count)
    revalidateTag(`profile-${event.userId}`)

    console.log(`[LDTE] Post artifacts generated for: ${event.postId}`)
}

async function handlePostUpdated(event: { type: "post.updated"; postId: string }) {
    // Revalidate post page
    revalidatePath(`/[locale]/post/${event.postId}`)

    console.log(`[LDTE] Post artifacts updated for: ${event.postId}`)
}

async function handlePostDeleted(event: { type: "post.deleted"; postId: string }) {
    // Revalidate sitemaps to remove
    revalidateTag("sitemap")
    revalidateTag("video-sitemap")
    revalidateTag("image-sitemap")

    console.log(`[LDTE] Post artifacts removed for: ${event.postId}`)
}

async function handleProfileUpdated(event: { type: "profile.updated"; userId: string; handle: string }) {
    // Revalidate profile page (triggers OG regeneration)
    revalidatePath(`/[locale]/${event.handle}`)

    // Revalidate sitemap
    revalidateTag("sitemap")

    // Tag for cache invalidation
    revalidateTag(`profile-${event.userId}`)

    console.log(`[LDTE] Profile artifacts updated for: @${event.handle}`)
}

async function handleBadgeEarned(event: { type: "badge.earned"; userId: string; badgeId: string }) {
    // Revalidate badge page (in case of stats update)
    revalidatePath(`/[locale]/badges/${event.badgeId}`)

    // Revalidate user profile to show new badge
    revalidateTag(`profile-${event.userId}`)

    console.log(`[LDTE] Badge artifacts updated: ${event.badgeId} for user ${event.userId}`)
}

async function handleUnlockCompleted(event: { type: "unlock.completed"; postId: string }) {
    // Revalidate unlock page
    revalidatePath(`/[locale]/unlock/${event.postId}`)

    // Update post stats (views/unlocks)
    revalidateTag(`post-${event.postId}`)

    console.log(`[LDTE] Unlock artifact created for: ${event.postId}`)
}

async function handleSubscriptionCreated(event: { type: "subscription.created"; creatorId: string }) {
    // Revalidate creator profile (subscriber count)
    revalidateTag(`profile-${event.creatorId}`)

    console.log(`[LDTE] Subscription tracked for creator: ${event.creatorId}`)
}

async function handleLiveStarted(event: { type: "live.started"; streamId: string; userId: string }) {
    // Revalidate live stream page
    revalidatePath(`/[locale]/live/${event.streamId}`)

    // Revalidate creator profile
    revalidateTag(`profile-${event.userId}`)

    console.log(`[LDTE] Live stream artifacts created: ${event.streamId}`)
}

async function handleLiveEnded(event: { type: "live.ended"; streamId: string }) {
    // Revalidate live stream page
    revalidatePath(`/[locale]/live/${event.streamId}`)

    console.log(`[LDTE] Live stream ended: ${event.streamId}`)
}

// === UTILITY FUNCTIONS ===

/**
 * Generate public shareable URL for an artifact
 */
export function getArtifactUrl(type: string, id: string, locale: string = "en"): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://fantikx.com"

    const paths: Record<string, string> = {
        post: `/post/${id}`,
        profile: `/${id}`,
        badge: `/badges/${id}`,
        unlock: `/unlock/${id}`,
        support: `/support/${id}`,
        live: `/live/${id}`,
    }

    return `${baseUrl}/${locale}${paths[type] || `/${type}/${id}`}`
}

/**
 * Check if content should generate public artifacts
 */
export function shouldGenerateArtifact(options: {
    isPublic: boolean
    isApproved: boolean
    optedOut?: boolean
}): boolean {
    // Only generate for public, approved content
    // Respect opt-out preference
    return options.isPublic && options.isApproved && !options.optedOut
}
