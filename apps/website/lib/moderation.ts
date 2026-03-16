"use server"

// Content moderation utility
// Supports Google Cloud Vision API and custom NSFW detection

interface ModerationResult {
  isNsfw: boolean
  blurLevel: number // 0 = none, 1 = soft, 2 = medium, 3 = heavy
  shouldReject: boolean
  reason?: string
  metadata: any
}

interface ModerationThresholds {
  adultThreshold: number // 0-1, for explicit nudity
  racyThreshold: number // 0-1, for suggestive content (higher = more lenient)
  violenceThreshold: number
  weaponsThreshold: number
}

// Racy content, LIKELY adult, POSSIBLE adult are NOT 18+
const DEFAULT_THRESHOLDS: ModerationThresholds = {
  adultThreshold: 0.9, // Only VERY_LIKELY = explicit nudity (was 0.7)
  racyThreshold: 1.0, // Ignore racy completely - it's not a reliable indicator
  violenceThreshold: 0.7,
  weaponsThreshold: 0.7,
}

async function checkApiConfiguration() {
  const hasApiKey = !!process.env.GOOGLE_CLOUD_VISION_API_KEY
  console.log("[v0] API Configuration Check:", {
    hasApiKey,
    keyPrefix: hasApiKey ? process.env.GOOGLE_CLOUD_VISION_API_KEY!.substring(0, 10) + "..." : "NOT SET",
  })
  return hasApiKey
}

/**
 * Moderate image using Google Cloud Vision SafeSearch
 */
async function moderateWithGoogleVision(imageUrl: string): Promise<ModerationResult> {
  try {
    console.log("[v0] Starting Google Vision moderation for:", imageUrl)

    if (!process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      console.error("[v0] CRITICAL: GOOGLE_CLOUD_VISION_API_KEY not found!")
      console.error("[v0] To fix: Add GOOGLE_CLOUD_VISION_API_KEY to environment variables in Vars section")
      console.warn("[v0] NSFW detection DISABLED - all content treated as safe by default")

      return {
        isNsfw: false,
        blurLevel: 0,
        shouldReject: false,
        metadata: {
          service: "none",
          reason: "not_configured",
          critical: "GOOGLE_CLOUD_VISION_API_KEY missing - NSFW detection disabled",
        },
      }
    }

    console.log("[v0] API key found, calling Vision API...")

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { source: { imageUri: imageUrl } },
              features: [{ type: "SAFE_SEARCH_DETECTION" }, { type: "LABEL_DETECTION", maxResults: 10 }],
            },
          ],
        }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      console.error("[v0] Google Vision API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData?.error?.message || "Unknown error",
        reason: errorData?.error?.status,
        details: errorData?.error?.details?.map((d: any) => d.reason) || [],
      })

      const isBillingError =
        errorData?.error?.status === "PERMISSION_DENIED" &&
        errorData?.error?.details?.some((d: any) => d.reason === "BILLING_DISABLED")

      if (isBillingError) {
        console.error("[v0] CRITICAL: BILLING NOT ENABLED for Google Cloud Vision API!")
        console.error("[v0] To fix: Go to https://console.cloud.google.com/billing and enable billing")
      }

      if (errorData?.error?.status === "PERMISSION_DENIED") {
        console.error("[v0] CRITICAL: API KEY INVALID or has insufficient permissions!")
      }

      return {
        isNsfw: false,
        blurLevel: 0,
        shouldReject: false,
        metadata: {
          service: "google_vision",
          error: errorData?.error?.message || response.statusText,
          status: response.status,
          reason: isBillingError ? "billing_disabled" : "api_error",
          warning: "API unavailable - content not moderated (NSFW detection offline)",
          critical: isBillingError
            ? "BILLING DISABLED - Go to: https://console.cloud.google.com/billing"
            : "API ERROR - Check API key and permissions",
        },
      }
    }

    const data = await response.json()
    const safeSearch = data.responses[0]?.safeSearchAnnotation
    const labels = data.responses[0]?.labelAnnotations || []

    console.log("[v0] Vision API response:", {
      adult: safeSearch?.adult,
      racy: safeSearch?.racy,
      violence: safeSearch?.violence,
      medical: safeSearch?.medical,
      topLabels: labels.slice(0, 3).map((l: any) => ({ desc: l.description, score: l.score })),
      imageUrl: imageUrl.substring(0, 100),
    })

    // Map likelihood levels to scores
    const likelihoodToScore = (level: string): number => {
      const map: Record<string, number> = {
        VERY_UNLIKELY: 0.1,
        UNLIKELY: 0.3,
        POSSIBLE: 0.5,
        LIKELY: 0.7,
        VERY_LIKELY: 0.9,
      }
      return map[level] || 0
    }

    const adultScore = likelihoodToScore(safeSearch?.adult || "UNKNOWN")
    const racyScore = likelihoodToScore(safeSearch?.racy || "UNKNOWN")
    const violenceScore = likelihoodToScore(safeSearch?.violence || "UNKNOWN")
    const medicalScore = likelihoodToScore(safeSearch?.medical || "UNKNOWN")

    // Check for weapons in labels
    const weaponLabels = ["weapon", "gun", "knife", "firearm", "rifle", "pistol"]
    const hasWeapons = labels.some(
      (label: any) => weaponLabels.some((w) => label.description.toLowerCase().includes(w)) && label.score > 0.7,
    )

    // These labels indicate non-explicit content like fashion, fitness, etc.
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

    // Decision logic
    const shouldReject = violenceScore >= DEFAULT_THRESHOLDS.violenceThreshold || medicalScore >= 0.8 || hasWeapons

    // Google Vision "adult" categories:
    // - VERY_UNLIKELY (0.1) = safe content
    // - UNLIKELY (0.3) = safe content
    // - POSSIBLE (0.5) = suggestive but clothed (NOT 18+)
    // - LIKELY (0.7) = revealing clothing, lingerie (NOT 18+)
    // - VERY_LIKELY (0.9) = explicit nudity (18+)
    //
    // We ONLY mark as 18+ if adult = VERY_LIKELY (explicit nudity)
    // Everything else including "racy" content is allowed

    let isNsfw = false

    if (adultScore >= 0.9) {
      // VERY_LIKELY adult = definitely explicit nudity - this is the ONLY case for 18+
      isNsfw = true
      console.log("[v0] NSFW: adult = VERY_LIKELY (explicit nudity detected)")
    } else {
      // Everything else is NOT 18+:
      // - adult = LIKELY (0.7) = revealing but not explicit
      // - adult = POSSIBLE (0.5) = suggestive but clothed
      // - racy at any level = swimwear, lingerie, fashion, fitness
      // - any content with clothing/fashion labels
      isNsfw = false
      console.log("[v0] NOT NSFW: adult =", safeSearch?.adult, "- not explicit nudity")
    }

    let blurLevel = 0
    if (isNsfw) {
      blurLevel = 3 // All 18+ content gets maximum blur
    }

    console.log("[v0] Moderation decision:", {
      isNsfw,
      blurLevel,
      shouldReject,
      scores: { adult: adultScore, racy: racyScore, violence: violenceScore },
      hasSafeLabels,
      thresholds: DEFAULT_THRESHOLDS,
    })

    return {
      isNsfw,
      blurLevel,
      shouldReject,
      reason: shouldReject
        ? violenceScore >= 0.5
          ? "violence_detected"
          : hasWeapons
            ? "weapons_detected"
            : "medical_content"
        : undefined,
      metadata: {
        service: "google_vision",
        safeSearch,
        labels: labels.slice(0, 5),
        scores: { adult: adultScore, racy: racyScore, violence: violenceScore },
        hasSafeLabels,
        confidence: Math.max(adultScore, racyScore), // Add overall confidence
      },
    }
  } catch (error) {
    console.error("[v0] Google Vision exception:", error)
    return {
      isNsfw: false,
      blurLevel: 0,
      shouldReject: false,
      metadata: { service: "google_vision", error: String(error), reason: "exception" },
    }
  }
}
import { detectAdultContentWithGoogle } from "./google-vision"
import { detectNSFWCustom, shouldCheckWithGoogle } from "./custom-nsfw-detector"

/**
 * Main moderation function with layered detection strategy:
 * 1. Custom NSFW analyzer (heuristics, no dependencies)
 * 2. Google Cloud Vision fallback (ML-based, when uncertain)
 */
export async function moderateContent(
  mediaUrlOrBuffer: string | Buffer,
  mediaType: "image" | "video",
  mimeType?: string,
  fileName?: string,
): Promise<ModerationResult> {
  console.log("[v0] Starting content moderation:", {
    type: mediaType,
    mimeType,
    fileName,
    isBuffer: Buffer.isBuffer(mediaUrlOrBuffer),
  })

  // Skip video moderation for now
  if (mediaType === "video") {
    return {
      isNsfw: false,
      blurLevel: 0,
      shouldReject: false,
      metadata: { service: "none", reason: "video_not_implemented" },
    }
  }

  try {
    // Step 1: Run custom NSFW detector first (no external dependencies)
    const customResult = await detectNSFWCustom(mediaUrlOrBuffer, fileName)
    console.log("[v0] Custom detector result:", {
      isNsfw: customResult.isNsfw,
      confidence: customResult.confidence,
      reasons: customResult.reasons,
    })

    // If custom detector is highly confident it's NSFW, mark it
    if (customResult.isNsfw && customResult.confidence > 0.7) {
      console.log("[v0] Custom detector confident: marking as NSFW")
      return {
        isNsfw: true,
        blurLevel: 3,
        shouldReject: false,
        metadata: {
          service: "custom_detector",
          reasons: customResult.reasons,
          confidence: customResult.confidence,
        },
      }
    }

    // Step 2: If uncertain, use Google Vision fallback
    if (shouldCheckWithGoogle(customResult)) {
      console.log("[v0] Custom detector uncertain, checking with Google Vision...")

      if (typeof mediaUrlOrBuffer === "string") {
        const googleResult = await detectAdultContentWithGoogle(Buffer.from(mediaUrlOrBuffer))
        if (googleResult.isNsfw) {
          console.log("[v0] Google Vision confirmed NSFW")
          return {
            isNsfw: true,
            blurLevel: 3,
            shouldReject: false,
            metadata: {
              service: "google_vision",
              confidence: googleResult.confidence,
              details: googleResult.details,
            },
          }
        }
      } else if (Buffer.isBuffer(mediaUrlOrBuffer)) {
        const googleResult = await detectAdultContentWithGoogle(mediaUrlOrBuffer)
        if (googleResult.isNsfw) {
          console.log("[v0] Google Vision confirmed NSFW")
          return {
            isNsfw: true,
            blurLevel: 3,
            shouldReject: false,
            metadata: {
              service: "google_vision",
              confidence: googleResult.confidence,
              details: googleResult.details,
            },
          }
        }
      }
    }

    // Step 3: Content is safe
    console.log("[v0] Content passed moderation - safe")
    return {
      isNsfw: false,
      blurLevel: 0,
      shouldReject: false,
      metadata: { service: "custom_detector", reason: "passed_checks" },
    }
  } catch (error) {
    console.error("[v0] Moderation error:", error)
    // On error, default to allowing content
    return {
      isNsfw: false,
      blurLevel: 0,
      shouldReject: false,
      metadata: { error: String(error), reason: "moderation_error" },
    }
  }
}

export async function moderateMultipleImages(imageUrls: string[]): Promise<ModerationResult[]> {
  return Promise.all(imageUrls.map((url) => moderateContent(url, "image")))
}
