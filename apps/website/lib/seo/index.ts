/**
 * SEO Library - Central export for all SEO utilities
 * 
 * Usage:
 * import { generateSEOMetadata, generateVideoSchema } from "@/lib/seo"
 */

// Core metadata generators
export {
    DEFAULT_SEO,
    getDefaultOgImage,
    resolveOgImageUrl,
    generateSEOMetadata,
    generatePostMetadata,
    generateProfileMetadata,
} from "./metadata"

// Structured Data (JSON-LD) generators
export {
    generateOrganizationSchema,
    generateWebsiteSchema,
    generateBreadcrumbSchema,
    generatePersonSchema,
    generateVideoSchema,
    generateFAQSchema,
    generateProductSchema,
    generateSocialPostSchema,
    generateLiveStreamSchema,
    generateUpcomingStreamSchema,
} from "./metadata"

// Re-export types
export type { Metadata } from "next"
