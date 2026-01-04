/**
 * Badge System Types
 * 
 * Part of Light Digital Trail Engine (LDTE)
 * Public badges that spread FanTikX presence passively
 */

export type BadgeTier = "bronze" | "silver" | "gold" | "diamond" | "special"

export interface Badge {
    id: string
    name: string
    description: string
    shortDescription: string
    icon: string // emoji or icon name
    tier: BadgeTier
    category: "creator" | "supporter" | "community" | "special"
    criteria: string[]
    isPublic: boolean
    createdAt?: string
}

export interface UserBadge {
    badgeId: string
    earnedAt: string
    userId: string
    isDisplayed: boolean // User can hide from public profile
}

export interface BadgeWithMeta extends Badge {
    earnedCount: number // How many users have this badge
    rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
}

// Colors for each tier
export const BADGE_TIER_COLORS: Record<BadgeTier, { bg: string; text: string; border: string }> = {
    bronze: { bg: "#CD7F32", text: "#FFFFFF", border: "#A0522D" },
    silver: { bg: "#C0C0C0", text: "#1A1A1A", border: "#A8A8A8" },
    gold: { bg: "#FFD700", text: "#1A1A1A", border: "#DAA520" },
    diamond: { bg: "#B9F2FF", text: "#1A1A1A", border: "#00CED1" },
    special: { bg: "linear-gradient(135deg, #FF1B6B, #FF758C)", text: "#FFFFFF", border: "#FF1B6B" },
}

// Badge rarity based on percentage of users who have it
export function calculateRarity(earnedCount: number, totalUsers: number): BadgeWithMeta["rarity"] {
    const percentage = (earnedCount / totalUsers) * 100
    if (percentage < 1) return "legendary"
    if (percentage < 5) return "epic"
    if (percentage < 15) return "rare"
    if (percentage < 35) return "uncommon"
    return "common"
}
