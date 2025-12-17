"use server"

import { createClient } from "@/lib/supabase/server"

/**
 * Generates a thumbnail for a post (1200x630 for OG images)
 * For videos: extracts first frame
 * For images: resizes to optimal OG size
 * For 18+ content: creates blurred version
 */
export async function generatePostThumbnail(postId: string) {
  const supabase = await createClient()

  // Get post data
  const { data: post, error } = await supabase.from("posts").select("*").eq("id", postId).single()

  if (error || !post || !post.media_urls || post.media_urls.length === 0) {
    console.error("[Thumbnail] Post not found or no media:", postId)
    return null
  }

  const firstMediaUrl = post.media_urls[0]
  const isVideo = post.content_type === "video"
  const isNSFW = post.is_nsfw || post.is_adult || post.blur_required

  try {
    // For now, use the first media URL as thumbnail
    // TODO: Implement actual thumbnail generation with Sharp or Canvas API
    const thumbnailUrl = firstMediaUrl
    let blurredThumbnailUrl = firstMediaUrl

    // If NSFW, we should generate a blurred version
    // For MVP, we'll use CSS blur via query param indicator
    if (isNSFW) {
      // Store metadata that this should be blurred in preview
      blurredThumbnailUrl = `${firstMediaUrl}?blur=true`
    }

    // Update post with thumbnail URLs
    const { error: updateError } = await supabase
      .from("posts")
      .update({
        thumbnail_url: thumbnailUrl,
        thumbnail_blurred_url: isNSFW ? blurredThumbnailUrl : thumbnailUrl,
      })
      .eq("id", postId)

    if (updateError) {
      console.error("[Thumbnail] Failed to update post:", updateError)
      return null
    }

    return {
      thumbnailUrl,
      blurredThumbnailUrl: isNSFW ? blurredThumbnailUrl : thumbnailUrl,
    }
  } catch (error) {
    console.error("[Thumbnail] Generation failed:", error)
    return null
  }
}

/**
 * Batch generate thumbnails for posts missing them
 */
export async function batchGenerateThumbnails(limit = 100) {
  const supabase = await createClient()

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id")
    .is("thumbnail_url", null)
    .not("media_urls", "is", null)
    .limit(limit)

  if (error || !posts) {
    console.error("[Thumbnail] Batch fetch failed:", error)
    return { success: false, processed: 0 }
  }

  let processed = 0
  for (const post of posts) {
    const result = await generatePostThumbnail(post.id)
    if (result) processed++
  }

  return { success: true, processed }
}
