"use server"

export interface DetectionResult {
  isNsfw: boolean
  confidence: number
  scores?: {
    nudity: number
    sexual_activity: number
    safe: number
  }
  details: any
}

export async function detectAdultContentWithGoogle(buffer: Buffer, _mimeType?: string): Promise<DetectionResult> {
  if (!process.env.GOOGLE_CLOUD_VISION_API_KEY) {
    console.warn("[v0] Google Cloud Vision API key not configured")
    return {
      isNsfw: false,
      confidence: 0,
      scores: { nudity: 0, sexual_activity: 0, safe: 1 },
      details: { reason: "api_not_configured" },
    }
  }

  // For server-side buffer analysis, we'd need to convert to base64
  // This is a placeholder for the actual implementation
  const base64 = buffer.toString("base64")

  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [{ type: "SAFE_SEARCH_DETECTION" }],
            },
          ],
        }),
      },
    )

    if (!response.ok) {
      console.error("[v0] Google Vision API error:", response.status)
      return {
        isNsfw: false,
        confidence: 0,
        scores: { nudity: 0, sexual_activity: 0, safe: 1 },
        details: { error: response.statusText },
      }
    }

    const data = await response.json()
    const safeSearch = data.responses[0]?.safeSearchAnnotation

    const adultLikelihood = safeSearch?.adult || "UNKNOWN"
    const isNsfw = adultLikelihood === "VERY_LIKELY"

    return {
      isNsfw,
      confidence: isNsfw ? 0.9 : 0.1,
      scores: {
        nudity: isNsfw ? 0.85 : 0,
        sexual_activity: isNsfw ? 0.65 : 0,
        safe: isNsfw ? 0.15 : 0.9,
      },
      details: { adult: adultLikelihood },
    }
  } catch (error) {
    console.error("[v0] Google Vision call failed:", error)
    return {
      isNsfw: false,
      confidence: 0,
      scores: { nudity: 0, sexual_activity: 0, safe: 1 },
      details: { error: String(error) },
    }
  }
}
