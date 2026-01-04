"use server"

export interface DetectionResult {
  isNsfw: boolean
  confidence: number
  details: any
}

export async function detectAdultContentWithGoogle(buffer: Buffer): Promise<DetectionResult> {
  if (!process.env.GOOGLE_CLOUD_VISION_API_KEY) {
    console.warn("[v0] Google Cloud Vision API key not configured")
    return { isNsfw: false, confidence: 0, details: { reason: "api_not_configured" } }
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
      return { isNsfw: false, confidence: 0, details: { error: response.statusText } }
    }

    const data = await response.json()
    const safeSearch = data.responses[0]?.safeSearchAnnotation

    const adultLikelihood = safeSearch?.adult || "UNKNOWN"
    const isNsfw = adultLikelihood === "VERY_LIKELY"

    return {
      isNsfw,
      confidence: isNsfw ? 0.9 : 0.1,
      details: { adult: adultLikelihood },
    }
  } catch (error) {
    console.error("[v0] Google Vision call failed:", error)
    return { isNsfw: false, confidence: 0, details: { error: String(error) } }
  }
}
