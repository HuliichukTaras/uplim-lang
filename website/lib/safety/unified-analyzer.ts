import { detectChildSafety } from "./child-safety-detector"
import { detectAnimalSafety } from "./animal-safety-detector"
import { detectViolence } from "./violence-detector"
import { makePolicyDecision } from "./policy-engine"
import type { ContentAnalysisResult, ContentAnalysisFlags, ContentAnalysisScores } from "./types"
import { detectNSFWContent } from "../nsfw-analyzer"
import { detectAdultContentWithGoogle } from "../google-vision"

export async function analyzeContent(
  buffer: Buffer,
  contentType: "image" | "video" | "text",
  mimeType?: string,
): Promise<ContentAnalysisResult> {
  console.log("[v0] Starting unified content analysis:", { contentType, mimeType })

  // Initialize flags and scores
  let flags: ContentAnalysisFlags = {
    csam: false,
    bestiality: false,
    explicit_sexual_activity: false,
    full_nudity: false,
    violence: false,
    gore: false,
    dismemberment: false,
    child: false,
    animal: false,
  }

  let scores: ContentAnalysisScores = {
    safe: 1.0,
    suggestive: 0,
    nudity: 0,
    sexual_activity: 0,
  }

  if (contentType === "video") {
    console.log("[v0] Video detected - using aggressive analysis")
    try {
      const previewBuffer = buffer.slice(0, Math.min(100000, buffer.length))
      console.log("[v0] Video preview buffer size:", previewBuffer.length)

      // Always use Google Vision for video - it's most reliable for video content
      console.log("[v0] Forwarding video to Google Cloud Vision for analysis")
      const googleResult = await detectAdultContentWithGoogle(buffer, mimeType || "video/mp4")
      console.log("[v0] Google Vision result:", {
        isNsfw: googleResult.isNsfw,
        scores: googleResult.scores,
      })

      if (googleResult.isNsfw) {
        flags.full_nudity = googleResult.scores.nudity > 0.5
        flags.explicit_sexual_activity = googleResult.scores.sexual_activity > 0.4
        scores.nudity = googleResult.scores.nudity
        scores.sexual_activity = googleResult.scores.sexual_activity
        scores.safe = 0
        return makePolicyDecision(flags, scores)
      }

      // If Google Vision is uncertain, also analyze preview with local detector
      console.log("[v0] Google Vision returned safe - analyzing preview locally for double-check")
      const previewResult = await detectNSFWContent(previewBuffer, "image/jpeg")
      console.log("[v0] Preview local analysis:", {
        isNsfw: previewResult.isNsfw,
        nudity: previewResult.scores.nudity,
        sexual: previewResult.scores.sexual_activity,
      })

      if (previewResult.isNsfw || previewResult.scores.nudity > 0.35 || previewResult.scores.sexual_activity > 0.3) {
        console.log("[v0] Preview analysis detected NSFW - marking as 18+")
        flags.full_nudity = true
        flags.explicit_sexual_activity = true
        scores.nudity = Math.max(previewResult.scores.nudity, 0.5)
        scores.sexual_activity = Math.max(previewResult.scores.sexual_activity, 0.45)
        scores.safe = 0
      }

      return makePolicyDecision(flags, scores)
    } catch (error) {
      console.error("[v0] Video analysis error:", error)
      flags.explicit_sexual_activity = true
      return makePolicyDecision(flags, scores)
    }
  }

  // Step 1: Specialized detectors (parallel)
  console.log("[v0] Running specialized detectors...")
  const [childFlags, animalFlags, violenceScores] = await Promise.all([
    detectChildSafety(buffer),
    detectAnimalSafety(buffer),
    detectViolence(buffer),
  ])

  // Merge flags - ANY positive flag is propagated
  flags = {
    ...flags,
    csam: childFlags.csam || flags.csam,
    child: childFlags.child || flags.child,
    bestiality: animalFlags.bestiality || flags.bestiality,
    animal: animalFlags.animal || flags.animal,
    violence: violenceScores.sexual_activity > 0.75 || flags.violence,
  }

  // Merge violence scores
  scores = {
    ...scores,
    ...violenceScores,
  }

  // If hard block detected, return early
  if (flags.csam || flags.bestiality) {
    console.log("[v0] Hard block detected - returning immediately")
    return makePolicyDecision(flags, scores)
  }

  // Step 2: General content analysis (custom detector first)
  console.log("[v0] Running custom NSFW detector...")
  const customResult = await detectNSFWContent(buffer, mimeType || "image/jpeg")

  if (customResult.isNsfw && customResult.confidence > 0.7) {
    console.log("[v0] Custom detector confident NSFW")
    scores.nudity = 0.85
    scores.sexual_activity = 0.8
  }

  // Step 3: Google Vision fallback if uncertain
  if (customResult.riskScore > 0.3 && customResult.riskScore < 0.7) {
    console.log("[v0] Custom detector uncertain - using Google Vision")
    try {
      const googleResult = await detectAdultContentWithGoogle(buffer)
      if (googleResult.isNsfw) {
        scores.nudity = 0.8
      }
    } catch (error) {
      console.error("[v0] Google Vision error:", error)
    }
  }

  // Step 4: Make policy decision
  return makePolicyDecision(flags, scores)
}
