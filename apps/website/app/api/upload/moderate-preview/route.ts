import { NextResponse, type NextRequest } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const { base64, mediaType } = await request.json()

    if (!base64 || typeof base64 !== "string") {
      return NextResponse.json({ success: false, error: "Missing base64 data" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY

    if (!apiKey) {
      console.warn("[v0] Google Vision API key not found - allowing content")
      return NextResponse.json({
        success: true,
        moderation: {
          isNsfw: false,
          confidence: 0,
          blurLevel: 0,
          fallback: true,
        },
      })
    }

    if (mediaType?.startsWith("video/")) {
      console.log("[v0] Video detected - allowing pending moderation")
      return NextResponse.json({
        success: true,
        moderation: {
          isNsfw: false,
          confidence: 0,
          blurLevel: 0,
          requiresReview: true,
        },
      })
    }

    const maxBase64Size = 4 * 1024 * 1024 // 4MB limit
    if (base64.length > maxBase64Size) {
      console.warn("[v0] Image too large for Vision API - allowing content")
      return NextResponse.json({
        success: true,
        moderation: {
          isNsfw: false,
          confidence: 0,
          blurLevel: 0,
          tooLarge: true,
        },
      })
    }

    console.log("[v0] Calling Google Vision API for preview moderation")

    const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64.replace(/^data:image\/\w+;base64,/, "") },
            features: [
              { type: "SAFE_SEARCH_DETECTION", maxResults: 1 },
              { type: "LABEL_DETECTION", maxResults: 10 },
            ],
          },
        ],
      }),
    })

    const contentType = visionResponse.headers.get("content-type")

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text()
      console.error("[v0] Google Vision API error:", visionResponse.status, errorText.substring(0, 200))
      return NextResponse.json({
        success: true,
        moderation: {
          isNsfw: false,
          confidence: 0,
          blurLevel: 0,
          apiError: true,
        },
      })
    }

    if (!contentType?.includes("application/json")) {
      const errorText = await visionResponse.text()
      console.error("[v0] Vision API returned non-JSON:", errorText.substring(0, 200))
      return NextResponse.json({
        success: true,
        moderation: {
          isNsfw: false,
          confidence: 0,
          blurLevel: 0,
          parseError: true,
        },
      })
    }

    const visionData = await visionResponse.json()
    const safeSearch = visionData.responses?.[0]?.safeSearchAnnotation
    const labels = visionData.responses?.[0]?.labelAnnotations || []

    if (!safeSearch) {
      console.warn("[v0] No safe search annotation in response")
      return NextResponse.json({
        success: true,
        moderation: {
          isNsfw: false,
          confidence: 0,
          blurLevel: 0,
          noAnnotation: true,
        },
      })
    }

    const likelihoodMap: Record<string, number> = {
      VERY_UNLIKELY: 0.1,
      UNLIKELY: 0.3,
      POSSIBLE: 0.5,
      LIKELY: 0.7,
      VERY_LIKELY: 0.9,
    }

    const adultScore = likelihoodMap[safeSearch.adult] || 0
    const racyScore = likelihoodMap[safeSearch.racy] || 0
    const violenceScore = likelihoodMap[safeSearch.violence] || 0

    const safeLabels = [
      "dress",
      "clothing",
      "fashion",
      "model",
      "swimwear",
      "bikini",
      "lingerie",
      "fitness",
      "workout",
      "exercise",
      "sport",
      "athlete",
      "beauty",
      "glamour",
      "portrait",
      "selfie",
      "photo shoot",
      "studio",
      "beach",
      "pool",
      "summer",
      "woman",
      "man",
      "person",
      "human",
      "face",
      "smile",
      "photography",
    ]

    const hasSafeLabels = labels.some(
      (label: any) => safeLabels.some((s) => label.description.toLowerCase().includes(s)) && label.score > 0.6,
    )

    // Google Vision "adult" levels:
    // - VERY_UNLIKELY/UNLIKELY = safe
    // - POSSIBLE = suggestive but clothed (NOT 18+)
    // - LIKELY = revealing clothing, lingerie (NOT 18+)
    // - VERY_LIKELY = explicit nudity (18+)
    //
    // Only VERY_LIKELY adult (0.9) triggers 18+ flag
    // Racy content is completely ignored - it flags swimwear, dresses, fitness photos

    let isNsfw = false
    let confidence = 0

    if (adultScore >= 0.9) {
      // VERY_LIKELY adult = explicit nudity - ONLY case for 18+
      isNsfw = true
      confidence = adultScore
      console.log("[v0] NSFW: adult = VERY_LIKELY (explicit nudity detected)")
    } else {
      // Everything else is NOT 18+:
      // - adult = LIKELY (0.7) = revealing but clothed
      // - adult = POSSIBLE (0.5) = suggestive
      // - racy at any level = normal fashion/fitness content
      isNsfw = false
      confidence = adultScore
      console.log("[v0] NOT NSFW: adult =", safeSearch.adult, "- not explicit nudity")
    }

    console.log("[v0] Vision API result:", {
      adult: safeSearch.adult,
      racy: safeSearch.racy,
      violence: safeSearch.violence,
      adultScore,
      racyScore,
      hasSafeLabels,
      topLabels: labels.slice(0, 3).map((l: any) => l.description),
      isNsfw,
    })

    return NextResponse.json({
      success: true,
      moderation: {
        isNsfw,
        confidence,
        blurLevel: isNsfw ? 3 : 0,
        metadata: {
          adult: safeSearch.adult,
          racy: safeSearch.racy,
          violence: safeSearch.violence,
          hasSafeLabels,
        },
      },
    })
  } catch (error) {
    console.error("[v0] Preview moderation error:", error)
    return NextResponse.json({
      success: true,
      moderation: {
        isNsfw: false,
        confidence: 0,
        blurLevel: 0,
        exception: true,
      },
    })
  }
}
