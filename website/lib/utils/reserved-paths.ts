/**
 * Reserved Paths
 * 
 * These paths cannot be used as usernames because they are
 * reserved for system routes.
 */

export const RESERVED_PATHS = new Set([
    // Auth & User
    "auth",
    "login",
    "signup",
    "register",
    "logout",
    "settings",
    "profile",
    "user",
    "account",

    // Content
    "feed",
    "discover",
    "explore",
    "search",
    "post",
    "posts",
    "upload",
    "live",
    "reels",
    "stories",

    // Features
    "messages",
    "notifications",
    "wallet",
    "favorites",
    "dashboard",
    "analytics",
    "promote",
    "badges",
    "unlock",
    "support",

    // Static Pages
    "about",
    "help",
    "faq",
    "contact",
    "pricing",
    "features",
    "legal",
    "terms",
    "privacy",
    "safety",
    "careers",
    "press",
    "blog",

    // System
    "api",
    "admin",
    "static",
    "assets",
    "images",
    "media",
    "ai",
    "sitemap",
    "robots",

    // Reserved words
    "home",
    "index",
    "new",
    "edit",
    "delete",
    "create",
    "update",
    "null",
    "undefined",
    "true",
    "false",
])

/**
 * Check if a path is reserved
 */
export function isReservedPath(path: string): boolean {
    return RESERVED_PATHS.has(path.toLowerCase())
}

/**
 * Check if a string could be a valid username
 */
export function isValidUsername(username: string): boolean {
    // Must be 3-30 characters
    if (username.length < 3 || username.length > 30) return false

    // Must only contain allowed characters
    if (!/^[a-z0-9._-]+$/i.test(username)) return false

    // Cannot be reserved
    if (isReservedPath(username)) return false

    return true
}
