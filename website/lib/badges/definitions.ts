import type { Badge } from "./types"

/**
 * Badge Definitions
 * 
 * All system badges with their criteria.
 * Each badge has a public page at /badges/{id}
 */

export const BADGES: Record<string, Badge> = {
    // === CREATOR BADGES ===
    verified_creator: {
        id: "verified_creator",
        name: "Verified Creator",
        description: "This creator has verified their identity with FanTikX. Their profile is authentic and trustworthy.",
        shortDescription: "Identity verified",
        icon: "✓",
        tier: "gold",
        category: "creator",
        criteria: [
            "Submit valid government ID",
            "Complete identity verification",
            "Agree to Creator Terms",
        ],
        isPublic: true,
    },

    active_creator: {
        id: "active_creator",
        name: "Active Creator",
        description: "A dedicated content creator who regularly shares new content with their audience.",
        shortDescription: "10+ posts shared",
        icon: "🎨",
        tier: "bronze",
        category: "creator",
        criteria: [
            "Create at least 10 posts",
            "Be active in the last 30 days",
        ],
        isPublic: true,
    },

    popular_creator: {
        id: "popular_creator",
        name: "Popular Creator",
        description: "A creator with a growing community of fans and supporters.",
        shortDescription: "100+ followers",
        icon: "⭐",
        tier: "silver",
        category: "creator",
        criteria: [
            "Reach 100 followers",
            "Have at least 5 posts",
        ],
        isPublic: true,
    },

    top_creator: {
        id: "top_creator",
        name: "Top Creator",
        description: "One of the most successful creators on FanTikX with a large, engaged audience.",
        shortDescription: "1000+ followers",
        icon: "👑",
        tier: "diamond",
        category: "creator",
        criteria: [
            "Reach 1000 followers",
            "Have at least 50 posts",
            "High engagement rate",
        ],
        isPublic: true,
    },

    rising_star: {
        id: "rising_star",
        name: "Rising Star",
        description: "A new creator showing exceptional growth and engagement.",
        shortDescription: "Fast-growing creator",
        icon: "🚀",
        tier: "silver",
        category: "creator",
        criteria: [
            "Gain 50+ followers in first month",
            "Post at least 5 times",
        ],
        isPublic: true,
    },

    // === SUPPORTER BADGES ===
    first_supporter: {
        id: "first_supporter",
        name: "First Supporter",
        description: "Made their first support action on FanTikX - every journey starts somewhere!",
        shortDescription: "First purchase",
        icon: "💝",
        tier: "bronze",
        category: "supporter",
        criteria: [
            "Make first content unlock or subscription",
        ],
        isPublic: true,
    },

    loyal_supporter: {
        id: "loyal_supporter",
        name: "Loyal Supporter",
        description: "A dedicated fan who actively supports their favorite creators.",
        shortDescription: "10+ purchases",
        icon: "💎",
        tier: "silver",
        category: "supporter",
        criteria: [
            "Make 10+ purchases",
            "Support at least 3 different creators",
        ],
        isPublic: true,
    },

    super_supporter: {
        id: "super_supporter",
        name: "Super Supporter",
        description: "An exceptional patron of the creator community.",
        shortDescription: "50+ purchases",
        icon: "🏆",
        tier: "gold",
        category: "supporter",
        criteria: [
            "Make 50+ purchases",
            "Active subscription to 5+ creators",
        ],
        isPublic: true,
    },

    // === COMMUNITY BADGES ===
    early_adopter: {
        id: "early_adopter",
        name: "Early Adopter",
        description: "One of the first users to join FanTikX. A pioneer of our community!",
        shortDescription: "Joined in 2024",
        icon: "🌟",
        tier: "special",
        category: "community",
        criteria: [
            "Register before December 31, 2024",
        ],
        isPublic: true,
    },

    community_builder: {
        id: "community_builder",
        name: "Community Builder",
        description: "Actively helps grow and improve the FanTikX community.",
        shortDescription: "Active community member",
        icon: "🤝",
        tier: "silver",
        category: "community",
        criteria: [
            "Provide helpful feedback",
            "Report bugs or issues",
            "Invite other users",
        ],
        isPublic: true,
    },

    // === SPECIAL BADGES ===
    beta_tester: {
        id: "beta_tester",
        name: "Beta Tester",
        description: "Helped test new features before they were released to everyone.",
        shortDescription: "Tested beta features",
        icon: "🧪",
        tier: "special",
        category: "special",
        criteria: [
            "Participate in beta testing program",
            "Provide detailed feedback",
        ],
        isPublic: true,
    },

    content_champion: {
        id: "content_champion",
        name: "Content Champion",
        description: "Creates exceptionally high-quality content that engages the community.",
        shortDescription: "High-quality content",
        icon: "🏅",
        tier: "diamond",
        category: "special",
        criteria: [
            "Consistently high engagement",
            "Positive community feedback",
            "Selected by FanTikX team",
        ],
        isPublic: true,
    },
}

// Get all badges
export function getAllBadges(): Badge[] {
    return Object.values(BADGES)
}

// Get badge by ID
export function getBadgeById(id: string): Badge | undefined {
    return BADGES[id]
}

// Get badges by category
export function getBadgesByCategory(category: Badge["category"]): Badge[] {
    return Object.values(BADGES).filter(b => b.category === category)
}

// Get badges by tier
export function getBadgesByTier(tier: Badge["tier"]): Badge[] {
    return Object.values(BADGES).filter(b => b.tier === tier)
}
