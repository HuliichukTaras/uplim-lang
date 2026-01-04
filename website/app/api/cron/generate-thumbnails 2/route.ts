import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const maxDuration = 300 // 5 minutes

export async function GET(request: Request) {
    // Verify cron secret
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Find posts without thumbnail_url
    const { data: posts, error } = await supabase
        .from("posts")
        .select("id, media_urls, media_type, video_url, is_nsfw, is_adult, blur_required")
        .is("thumbnail_url", null)
        .not("media_urls", "is", null)
        .limit(100)

    if (error) {
        console.error("[Cron] Failed to fetch posts:", error)
        return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
    }

    let processed = 0
    let failed = 0

    for (const post of posts || []) {
        try {
            const firstMediaUrl = post.media_urls?.[0]
            if (!firstMediaUrl) continue

            const isVideo = post.media_type === "video" || post.video_url || firstMediaUrl.match(/\.(mp4|mov|webm)$/i)

            const isNSFW = post.is_nsfw || post.is_adult || post.blur_required

            // For videos without thumbnail, use placeholder or generate
            // For images, use the image itself
            let thumbnailUrl = firstMediaUrl

            // If it's a video file, we need a proper thumbnail (not the video URL)
            if (isVideo && firstMediaUrl.match(/\.(mp4|mov|webm)$/i)) {
                // Use a default video thumbnail or rely on upload-time generation
                // For now, set to null to indicate it needs manual generation
                thumbnailUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/video-thumbnail-placeholder.jpg`
            }

            const { error: updateError } = await supabase
                .from("posts")
                .update({
                    thumbnail_url: thumbnailUrl,
                    thumbnail_blurred_url: isNSFW ? `${thumbnailUrl}?blur=true` : thumbnailUrl,
                })
                .eq("id", post.id)

            if (updateError) {
                console.error(`[Cron] Failed to update post ${post.id}:`, updateError)
                failed++
            } else {
                processed++
            }
        } catch (err) {
            console.error(`[Cron] Error processing post ${post.id}:`, err)
            failed++
        }
    }

    return NextResponse.json({
        success: true,
        processed,
        failed,
        total: posts?.length || 0,
    })
}
