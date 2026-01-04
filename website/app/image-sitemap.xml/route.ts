import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Image Sitemap for Google Image Search
 * 
 * Follows Google Image Sitemap specification:
 * https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps
 * 
 * Helps images appear in:
 * - Google Image Search
 * - Google Discover
 * - Pinterest
 */

export const dynamic = "force-dynamic"
export const revalidate = 3600 // 1 hour

export async function GET() {
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://fantikx.com").replace(/\/$/, "")
    const supabase = await createClient()

    // Fetch image posts (non-NSFW, approved, public)
    const { data: imagePosts, error } = await supabase
        .from("posts")
        .select(`
      id,
      caption,
      media_urls,
      thumbnail_url,
      created_at,
      updated_at,
      media_type,
      profiles!posts_user_id_fkey (
        handle,
        display_name
      )
    `)
        .eq("moderation_status", "approved")
        .eq("is_nsfw", false)
        .eq("is_paid", false)
        .neq("media_type", "video")
        .order("created_at", { ascending: false })
        .limit(2000)

    if (error) {
        console.error("Error fetching image posts:", error)
        return new NextResponse(generateEmptySitemap(), {
            headers: getHeaders(),
        })
    }

    // Also fetch profile avatars
    const { data: profiles } = await supabase
        .from("profiles")
        .select("handle, display_name, avatar_url, updated_at")
        .not("avatar_url", "is", null)
        .limit(500)

    const imageEntries: string[] = []

    // Process posts with images
    for (const post of imagePosts || []) {
        const profile = post.profiles as any
        const pageUrl = `${baseUrl}/en/post/${post.id}`
        const title = post.caption?.slice(0, 100) || `Image by ${profile?.display_name || profile?.handle || "Creator"}`

        // Get all image URLs from the post
        const imageUrls = (post.media_urls || [])
            .filter((url: string) => isImageUrl(url))
            .slice(0, 10) // Max 10 images per page

        if (imageUrls.length === 0 && post.thumbnail_url && isImageUrl(post.thumbnail_url)) {
            imageUrls.push(post.thumbnail_url)
        }

        if (imageUrls.length > 0) {
            imageEntries.push(generateUrlEntry(pageUrl, imageUrls, title, post.caption))
        }
    }

    // Process profile avatars
    for (const profile of profiles || []) {
        if (profile.avatar_url && isImageUrl(profile.avatar_url)) {
            const pageUrl = `${baseUrl}/en/${profile.handle}`
            const title = `${profile.display_name || profile.handle} - Profile`
            imageEntries.push(generateUrlEntry(pageUrl, [profile.avatar_url], title))
        }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Fantikx Image Sitemap -->
  <!-- Generated: ${new Date().toISOString()} -->
  <!-- Total entries: ${imageEntries.length} -->
${imageEntries.join("\n")}
</urlset>`

    return new NextResponse(xml, {
        headers: getHeaders(),
    })
}

function getHeaders() {
    return {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
    }
}

function generateEmptySitemap(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- No images available -->
</urlset>`
}

function isImageUrl(url: string): boolean {
    if (!url) return false
    return /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(url)
}

function escapeXml(text: string): string {
    if (!text) return ""
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;")
}

function generateUrlEntry(
    pageUrl: string,
    imageUrls: string[],
    title: string,
    caption?: string
): string {
    const imageElements = imageUrls
        .map(url => `
      <image:image>
        <image:loc>${escapeXml(url)}</image:loc>
        <image:title>${escapeXml(title)}</image:title>
        ${caption ? `<image:caption>${escapeXml(caption.slice(0, 1000))}</image:caption>` : ""}
      </image:image>`)
        .join("")

    return `
  <url>
    <loc>${escapeXml(pageUrl)}</loc>${imageElements}
  </url>`
}
