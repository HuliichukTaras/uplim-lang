/**
 * Custom NSFW detection system - NO EXTERNAL DEPENDENCIES
 * Analyzes images without relying on machine learning models
 */

interface CustomNSFWResult {
  isNsfw: boolean
  confidence: number // 0-1
  reasons: string[]
  riskScore: number // 0-1, composite risk
}

/**
 * Analyze image buffer/URL for NSFW indicators
 * Uses heuristic analysis without ML models
 */
export async function detectNSFWCustom(
  imageUrlOrBuffer: string | Buffer,
  fileName?: string,
): Promise<CustomNSFWResult> {
  const reasons: string[] = []
  let riskScore = 0

  // Check 1: Filename keywords
  if (fileName) {
    const nsfwKeywords = [
      "nude",
      "naked",
      "nsfw",
      "adult",
      "porn",
      "sex",
      "xxx",
      "18+",
      "explicit",
      "private",
      "intimate",
    ]
    const lowerName = fileName.toLowerCase()
    const foundKeywords = nsfwKeywords.filter((kw) => lowerName.includes(kw))

    if (foundKeywords.length > 0) {
      reasons.push(`Filename contains NSFW keywords: ${foundKeywords.join(", ")}`)
      riskScore += 0.4 // High risk from filename
    }
  }

  // Check 2: File size and MIME type
  if (typeof imageUrlOrBuffer === "string") {
    // URL-based detection
    try {
      const response = await fetch(imageUrlOrBuffer, { method: "HEAD" })
      const contentLength = response.headers.get("content-length")
      const contentType = response.headers.get("content-type")

      if (contentLength) {
        const sizeMB = Number.parseInt(contentLength) / (1024 * 1024)

        // Very large images (>5MB) are less likely to be NSFW
        // Very small images (<50KB) are less likely to be high-quality NSFW
        if (sizeMB < 0.05) {
          riskScore -= 0.1
        } else if (sizeMB > 5) {
          riskScore -= 0.1
        } else if (sizeMB > 0.5) {
          // Mid-range sizes are more common for NSFW
          riskScore += 0.05
        }
      }

      // JPEG is more common for NSFW (better compression for photos)
      if (contentType?.includes("image/jpeg")) {
        riskScore += 0.1
        reasons.push("JPEG format (common for NSFW photos)")
      }

      // PNG is often used for graphics/art
      if (contentType?.includes("image/png")) {
        riskScore -= 0.05
      }
    } catch (error) {
      console.log("[v0] Could not fetch URL headers:", error)
    }
  } else if (Buffer.isBuffer(imageUrlOrBuffer)) {
    // Buffer-based detection
    const size = imageUrlOrBuffer.length
    const sizeMB = size / (1024 * 1024)

    // Check magic bytes for format
    const magicBytes = imageUrlOrBuffer.slice(0, 12)
    const isJpeg = magicBytes[0] === 0xff && magicBytes[1] === 0xd8
    const isPng = magicBytes.slice(1, 4).toString() === Buffer.from("PNG").toString()

    if (isJpeg) {
      riskScore += 0.1
      reasons.push("JPEG format detected")
    }

    if (isPng) {
      riskScore -= 0.05
    }

    // Size heuristics
    if (sizeMB < 0.05 || sizeMB > 5) {
      riskScore -= 0.1
    } else if (sizeMB > 0.5) {
      riskScore += 0.05
    }
  }

  // Check 3: Basic entropy check (very simple)
  // NSFW photos tend to have lower entropy due to skin tones
  if (Buffer.isBuffer(imageUrlOrBuffer) && imageUrlOrBuffer.length > 1000) {
    // Sample 256 bytes from middle of file
    const midPoint = Math.floor(imageUrlOrBuffer.length / 2)
    const sample = imageUrlOrBuffer.slice(midPoint, midPoint + 256)

    // Count unique bytes
    const uniqueBytes = new Set(sample)
    const entropy = uniqueBytes.size / 256

    // Low entropy (many repeated bytes) might indicate NSFW
    // Natural photos have higher entropy
    if (entropy < 0.3) {
      reasons.push("Low entropy detected (repetitive color patterns)")
      riskScore += 0.15
    } else if (entropy > 0.8) {
      reasons.push("High entropy detected (complex/varied patterns)")
      riskScore -= 0.1
    }
  }

  // Final decision
  const isNsfw = riskScore > 0.4
  const confidence = Math.min(1, Math.max(0, riskScore))

  return {
    isNsfw,
    confidence,
    reasons,
    riskScore,
  }
}

/**
 * Quick pre-check before sending to Google Vision
 * Returns true if should proceed to Google Vision for detailed check
 */
export function shouldCheckWithGoogle(customResult: CustomNSFWResult): boolean {
  // If custom detector is confident it's NSFW, skip Google
  if (customResult.isNsfw && customResult.confidence > 0.7) {
    return false // Already confident - don't bother Google
  }

  // If custom detector found suspicious indicators, double-check with Google
  if (customResult.riskScore > 0.3) {
    return true // Let Google make final call
  }

  // Default: skip Google for obvious non-NSFW
  return false
}
