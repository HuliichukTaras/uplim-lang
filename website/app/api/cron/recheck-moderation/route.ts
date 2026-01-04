import { createClient } from "@/lib/supabase/server"
import { moderateContent } from "@/lib/moderation"
import { NextResponse } from "next/server"

// Allow this to run for up to 5 minutes
export const maxDuration = 300
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Verify CRON_SECRET in production
    const authHeader = request.headers.get("authorization")
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const checkAll = searchParams.get("all") === "true"
    const fixFalsePositives = searchParams.get("fix") === "true"
    const dryRun = searchParams.get("dry") === "true"
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const supabase = await createClient()

    console.log("[Cron] Starting content recheck...", { checkAll, fixFalsePositives, dryRun, limit })

    // Build query
    let query = supabase
      .from("posts")
      .select(
        "id, media_urls, video_url, thumbnail_url, is_nsfw, is_adult, adult_confidence, blur_level, blur_required, is_locked, is_paid",
      )
      .order("created_at", { ascending: false })
      .limit(limit)

    // If not checking all, only check last 7 days
    if (!checkAll) {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      query = query.gte("created_at", sevenDaysAgo.toISOString())
    }

    // If fixing false positives, only check posts marked as NSFW
    if (fixFalsePositives) {
      query = query.eq("is_nsfw", true)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error("[Cron] Error fetching posts:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[Cron] Found ${posts?.length || 0} posts to scan`)

    const results = {
      scanned: 0,
      updated: 0,
      falsePositivesFixed: 0,
      newNsfwDetected: 0,
      errors: 0,
      details: [] as any[],
    }

    for (const post of posts || []) {
      results.scanned++

      try {
        const mediaUrls = post.media_urls || []
        if (post.thumbnail_url) {
          mediaUrls.push(post.thumbnail_url)
        }

        let maxConfidence = 0
        let isPostNsfw = false
        let blurLevel = 0
        const moderationDetails: any[] = []

        // Check all images in the post
        for (const url of mediaUrls) {
          if (typeof url !== "string" || !url) continue

          const result = await moderateContent(url, "image")

          moderationDetails.push({
            url: url.substring(0, 50) + "...",
            isNsfw: result.isNsfw,
            confidence: result.metadata?.confidence || 0,
            adult: result.metadata?.adult,
            racy: result.metadata?.racy,
          })

          if (result.isNsfw) {
            isPostNsfw = true
            blurLevel = Math.max(blurLevel, result.blurLevel)
          }

          if (result.metadata?.confidence) {
            maxConfidence = Math.max(maxConfidence, result.metadata.confidence)
          }
        }

        // Determine if update is needed
        const wasNsfw = post.is_nsfw || post.is_adult
        const shouldBeNsfw = isPostNsfw
        const stateChanged = wasNsfw !== shouldBeNsfw

        if (stateChanged) {
          if (wasNsfw && !shouldBeNsfw) {
            // False positive - was marked NSFW but shouldn't be
            results.falsePositivesFixed++
            console.log(`[Cron] FALSE POSITIVE: Post ${post.id} was incorrectly marked as NSFW`)
          } else if (!wasNsfw && shouldBeNsfw) {
            // Missed NSFW content
            results.newNsfwDetected++
            console.log(`[Cron] MISSED NSFW: Post ${post.id} should be marked as NSFW`)
          }

          results.details.push({
            id: post.id,
            action: wasNsfw && !shouldBeNsfw ? "false_positive_fixed" : "nsfw_detected",
            wasNsfw,
            shouldBeNsfw,
            confidence: maxConfidence,
            moderation: moderationDetails,
          })

          if (!dryRun) {
            // Update the post
            const updateData: any = {
              is_nsfw: shouldBeNsfw,
              is_adult: shouldBeNsfw,
              adult_confidence: maxConfidence,
              blur_required: shouldBeNsfw,
              blur_level: shouldBeNsfw ? blurLevel : 0,
            }

            // If no longer NSFW, remove locks (unless creator manually set them)
            if (!shouldBeNsfw) {
              updateData.is_locked = false
              updateData.is_paid = false
              updateData.blur_required = false
              updateData.blur_level = 0
            } else {
              // If now NSFW, add protections
              updateData.is_locked = true
              updateData.is_paid = true
            }

            await supabase.from("posts").update(updateData).eq("id", post.id)

            results.updated++
          }
        }
      } catch (err) {
        console.error(`[Cron] Error processing post ${post.id}:`, err)
        results.errors++
        results.details.push({
          id: post.id,
          action: "error",
          error: String(err),
        })
      }
    }

    console.log("[Cron] Recheck complete:", results)

    return NextResponse.json({
      success: true,
      dryRun,
      ...results,
    })
  } catch (error) {
    console.error("[Cron] Unhandled error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
