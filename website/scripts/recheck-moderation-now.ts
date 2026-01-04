import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const GOOGLE_VISION_API_KEY = process.env.GOOGLE_CLOUD_VISION_API_KEY

interface SafeSearchAnnotation {
  adult: string
  violence: string
  racy: string
}

interface VisionResponse {
  responses: Array<{
    safeSearchAnnotation?: SafeSearchAnnotation
    error?: { message: string }
  }>
}

async function analyzeImage(
  imageUrl: string,
): Promise<{ isAdult: boolean; confidence: string; details: SafeSearchAnnotation | null }> {
  if (!GOOGLE_VISION_API_KEY) {
    console.log("  ⚠️ No Google Vision API key - skipping analysis")
    return { isAdult: false, confidence: "UNKNOWN", details: null }
  }

  try {
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { source: { imageUri: imageUrl } },
            features: [{ type: "SAFE_SEARCH_DETECTION" }],
          },
        ],
      }),
    })

    const data: VisionResponse = await response.json()
    const annotation = data.responses?.[0]?.safeSearchAnnotation

    if (!annotation) {
      return { isAdult: false, confidence: "UNKNOWN", details: null }
    }

    const isAdult =
      ["LIKELY", "VERY_LIKELY"].includes(annotation.adult) || ["LIKELY", "VERY_LIKELY"].includes(annotation.racy)

    return {
      isAdult,
      confidence: annotation.adult,
      details: annotation,
    }
  } catch (error) {
    console.error("  ❌ Vision API error:", error)
    return { isAdult: false, confidence: "ERROR", details: null }
  }
}

async function main() {
  console.log("🔄 Starting 18+ content recheck...")
  console.log("=".repeat(50))

  // Get posts marked as adult (potential false positives)
  const { data: adultPosts, error: adultError } = await supabase
    .from("posts")
    .select("id, media_urls, is_adult, blur_preview, user_id, caption")
    .eq("is_adult", true)
    .order("created_at", { ascending: false })
    .limit(50)

  if (adultError) {
    console.error("❌ Error fetching posts:", adultError)
    return
  }

  console.log(`\n📋 Found ${adultPosts?.length || 0} posts marked as 18+\n`)

  let fixed = 0
  let confirmed = 0
  let errors = 0

  for (const post of adultPosts || []) {
    const mediaUrls = (post.media_urls as string[]) || []
    if (mediaUrls.length === 0) continue

    const firstMedia = mediaUrls[0]
    console.log(`\n🔍 Post ${post.id.slice(0, 8)}...`)
    console.log(`   Caption: ${(post.caption || "").slice(0, 40)}...`)

    const result = await analyzeImage(firstMedia)

    if (result.details) {
      console.log(
        `   Adult: ${result.details.adult}, Racy: ${result.details.racy}, Violence: ${result.details.violence}`,
      )
    }

    if (!result.isAdult && post.is_adult) {
      // False positive - unmark as adult
      console.log(`   ✅ FALSE POSITIVE - Removing 18+ flag`)

      const { error: updateError } = await supabase
        .from("posts")
        .update({
          is_adult: false,
          blur_preview: false,
          moderation_status: "approved",
          moderation_notes: `Recheck: Not adult content (${result.confidence})`,
        })
        .eq("id", post.id)

      if (updateError) {
        console.log(`   ❌ Update failed:`, updateError.message)
        errors++
      } else {
        fixed++
      }
    } else if (result.isAdult) {
      console.log(`   ⚠️ CONFIRMED as 18+ content`)
      confirmed++
    } else {
      console.log(`   ℹ️ Could not determine (${result.confidence})`)
    }

    // Rate limit
    await new Promise((r) => setTimeout(r, 500))
  }

  console.log("\n" + "=".repeat(50))
  console.log("📊 RESULTS:")
  console.log(`   ✅ Fixed (false positives removed): ${fixed}`)
  console.log(`   ⚠️ Confirmed as 18+: ${confirmed}`)
  console.log(`   ❌ Errors: ${errors}`)
  console.log("=".repeat(50))
}

main().catch(console.error)
