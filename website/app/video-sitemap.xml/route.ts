import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 3600 // Revalidate every hour

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://fantikx.com"
  const supabase = await createClient()

  const { data: videoPosts } = await supabase
    .from("posts")
    .select(`
      id,
      caption,
      media_urls,
      video_url,
      thumbnail_url,
      created_at,
      updated_at,
      view_count,
      like_count,
      is_nsfw,
      is_adult,
      is_paid,
      price,
      video_duration,
      media_type,
      profiles!posts_user_id_fkey (
        handle,
        display_name
      )
    `)
    .or("media_type.eq.video,video_url.neq.null")
    .eq("moderation_status", "approved")
    .order("created_at", { ascending: false })
    .limit(5000) // Increased limit

  const videoEntries = (videoPosts || [])
    .filter((post) => {
      // Must have video URL
      const videoUrl = post.video_url || post.media_urls?.[0]
      return videoUrl && videoUrl.match(/\.(mp4|mov|webm)$/i)
    })
    .map((post) => {
      const profile = post.profiles as any
      const videoUrl = post.video_url || post.media_urls?.[0]

      let thumbnailUrl = post.thumbnail_url
      if (!thumbnailUrl || thumbnailUrl.match(/\.(mp4|mov|webm)$/i)) {
        // If no thumbnail or thumbnail is a video, use default
        thumbnailUrl = `${baseUrl}/og-image.png`
      }

      const title = post.caption?.slice(0, 100) || `Video by ${profile?.display_name || profile?.handle || "Creator"}`
      const description = post.caption
        ? post.caption.slice(0, 2048)
        : `Watch this video from ${profile?.display_name || profile?.handle || "Creator"} on Fantikx`

      // Format duration as seconds for sitemap
      const durationSeconds = post.video_duration || undefined

      const familyFriendly = !(post.is_nsfw || post.is_adult) ? "yes" : "no"

      const requiresSubscription = post.is_paid ? "yes" : "no"

      return `
    <url>
      <loc>${baseUrl}/en/post/${post.id}</loc>
      <lastmod>${new Date(post.updated_at || post.created_at).toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
      <video:video>
        <video:thumbnail_loc>${escapeXml(thumbnailUrl)}</video:thumbnail_loc>
        <video:title>${escapeXml(title)}</video:title>
        <video:description>${escapeXml(description)}</video:description>
        <video:content_loc>${escapeXml(videoUrl)}</video:content_loc>
        <video:player_loc allow_embed="yes">${baseUrl}/en/post/${post.id}</video:player_loc>
        ${durationSeconds ? `<video:duration>${durationSeconds}</video:duration>` : ""}
        <video:publication_date>${new Date(post.created_at).toISOString()}</video:publication_date>
        <video:family_friendly>${familyFriendly}</video:family_friendly>
        <video:live>no</video:live>
        <video:requires_subscription>${requiresSubscription}</video:requires_subscription>
        <video:uploader info="${baseUrl}/en/profile/${profile?.handle || "user"}">${escapeXml(profile?.display_name || profile?.handle || "Creator")}</video:uploader>
        ${post.view_count ? `<video:view_count>${post.view_count}</video:view_count>` : ""}
        <video:tag>fantikx</video:tag>
        <video:tag>creator content</video:tag>
        ${post.is_paid ? `<video:price currency="USD">${post.price || 0}</video:price>` : ""}
      </video:video>
    </url>`
    })
    .join("")

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${videoEntries}
</urlset>`

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
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
