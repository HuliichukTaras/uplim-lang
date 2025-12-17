import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("[v0] Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const googleVisionApiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY

if (!googleVisionApiKey) {
  console.error("[v0] Missing GOOGLE_CLOUD_VISION_API_KEY environment variable")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function moderateImage(imageUrl: string) {
  try {
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { source: { imageUrl } },
            features: [{ type: "SAFE_SEARCH_DETECTION" }],
          },
        ],
      }),
    })

    const data = await response.json()

    if (data.responses?.[0]?.safeSearchAnnotation) {
      const annotation = data.responses[0].safeSearchAnnotation

      // Map likelihood to numeric score
      const likelihoodToScore = (likelihood: string) => {
        const map: Record<string, number> = {
          VERY_UNLIKELY: 0.1,
          UNLIKELY: 0.3,
          POSSIBLE: 0.5,
          LIKELY: 0.7,
          VERY_LIKELY: 0.9,
        }
        return map[likelihood] || 0
      }

      const adultScore = likelihoodToScore(annotation.adult || "VERY_UNLIKELY")
      const racyScore = likelihoodToScore(annotation.racy || "VERY_UNLIKELY")
      const maxScore = Math.max(adultScore, racyScore)

      // Strict threshold: LIKELY or VERY_LIKELY only (≥0.7)
      const isNsfw = maxScore >= 0.7

      return {
        isNsfw,
        confidence: maxScore,
        blurLevel: isNsfw ? 30 : 0, // 30% opacity for frosted glass effect
      }
    }

    return { isNsfw: false, confidence: 0, blurLevel: 0 }
  } catch (error) {
    console.error("[v0] Error moderating image:", error)
    return { isNsfw: false, confidence: 0, blurLevel: 0 }
  }
}

async function recheckContentModeration() {
  console.log("[v0] Starting periodic content recheck...")

  // Get all posts from last 7 days that haven't been rechecked recently
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, media_urls, video_url, is_nsfw, adult_confidence")
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching posts:", error)
    return
  }

  console.log(`[v0] Found ${posts?.length || 0} posts to recheck`)

  for (const post of posts || []) {
    try {
      // Recheck each media URL
      const mediaUrls = post.media_urls || []

      for (const url of mediaUrls) {
        const moderation = await moderateImage(url)

        const { isNsfw, confidence, blurLevel } = moderation

        // Update post if status changed
        if (isNsfw !== post.is_nsfw || Math.abs((confidence || 0) - (post.adult_confidence || 0)) > 0.1) {
          console.log(`[v0] Updating post ${post.id}: isNsfw=${isNsfw}, confidence=${confidence}`)

          await supabase
            .from("posts")
            .update({
              is_nsfw: isNsfw,
              is_adult: isNsfw,
              adult_confidence: confidence,
              blur_required: isNsfw,
              blur_level: blurLevel,
              is_locked: isNsfw,
              is_paid: isNsfw,
              ppv_price_cents: isNsfw ? 150 : null, // Fixed €1.50
              unlock_via_ppv: isNsfw,
              unlock_via_quest: isNsfw,
              unlock_via_subscription: true,
            })
            .eq("id", post.id)
        }
      }

      // Small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 200))
    } catch (error) {
      console.error(`[v0] Error rechecking post ${post.id}:`, error)
    }
  }

  console.log("[v0] Content recheck completed")
}

// Run the recheck
recheckContentModeration()
  .then(() => {
    console.log("[v0] Recheck script finished successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("[v0] Recheck script failed:", error)
    process.exit(1)
  })
