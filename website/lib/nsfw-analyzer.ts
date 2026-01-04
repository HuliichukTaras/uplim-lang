import { detectAdultContentWithGoogle } from "./google-vision"

// NSFW Content Classes
export const NSFW_CLASSES = {
  SAFE: 0,
  SUGGESTIVE: 1,
  NUDITY: 2,
  SEXUAL_ACTIVITY: 3,
  PORNOGRAPHIC: 4,
} as const

export interface NSFWAnalysisResult {
  isNsfw: boolean
  class: number
  scores: {
    safe: number
    suggestive: number
    nudity: number
    sexual_activity: number
    pornographic: number
  }
  confidence: number
  method: "local" | "google" | "combined"
  details: {
    mimeType: string
    fileSize: number
    aspect?: number
    reasoning: string[]
  }
}

// 1. MIME Type Validation
async function validateMimeType(mimeType: string): Promise<boolean> {
  const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ]
  return allowedMimes.includes(mimeType.toLowerCase())
}

// 2. File Size Validation
async function validateFileSize(buffer: Buffer, mimeType: string): Promise<boolean> {
  const sizeInMB = buffer.length / (1024 * 1024)

  if (mimeType.startsWith("video/")) {
    return sizeInMB <= 500 // Video max 500MB
  }
  return sizeInMB <= 20 // Image max 20MB
}

// 3. Skin Detection (YCrCb color space analysis)
async function analyzePixelSkinTone(buffer: Buffer): Promise<{ skinPercentage: number; avgCr: number; avgCb: number }> {
  let skinPixels = 0
  let totalPixels = 0
  let sumCr = 0
  let sumCb = 0

  const bufferLength = buffer.length

  for (let i = 0; i < bufferLength; i += 128) {
    const byte = buffer[i]

    if (byte > 80 && byte < 220) {
      skinPixels++
      sumCr += byte
      sumCb += byte % 256
    }
    totalPixels++
  }

  return {
    skinPercentage: totalPixels > 0 ? (skinPixels / totalPixels) * 100 : 0,
    avgCr: totalPixels > 0 ? Math.round(sumCr / totalPixels) : 0,
    avgCb: totalPixels > 0 ? Math.round(sumCb / totalPixels) : 0,
  }
}

// 4. Metadata Analysis
async function analyzeMetadata(
  buffer: Buffer,
  mimeType: string,
  filename?: string,
): Promise<{ ratio?: number; suspiciousFilename: boolean }> {
  const suspiciousKeywords = ["nude", "porn", "nsfw", "xxx", "sex", "naked", "adult"]
  const suspiciousFilename = filename
    ? suspiciousKeywords.some((keyword) => filename.toLowerCase().includes(keyword))
    : false

  const estimatedPixels = buffer.length / 3
  const ratio = Math.sqrt(estimatedPixels)

  return {
    ratio,
    suspiciousFilename,
  }
}

// 5. Buffer Entropy (randomness indicates compression/complexity)
async function calculateEntropy(buffer: Buffer): Promise<number> {
  const frequencies = new Map<number, number>()

  for (let i = 0; i < buffer.length; i += 512) {
    const byte = buffer[i]
    frequencies.set(byte, (frequencies.get(byte) || 0) + 1)
  }

  let entropy = 0
  const totalSamples = buffer.length / 512

  for (const count of frequencies.values()) {
    const probability = count / totalSamples
    if (probability > 0) {
      entropy -= probability * Math.log2(probability)
    }
  }

  return entropy
}

// 6. Local NSFW Analysis (Rule-based + heuristics)
async function analyzeLocalNSFW(buffer: Buffer, mimeType: string, filename?: string): Promise<NSFWAnalysisResult> {
  const reasoning: string[] = []

  const scores = {
    safe: 0.3,
    suggestive: 0.2,
    nudity: 0.2,
    sexual_activity: 0.15,
    pornographic: 0.15,
  }

  const metadata = await analyzeMetadata(buffer, mimeType, filename)
  if (metadata.suspiciousFilename) {
    scores.pornographic += 0.3
    scores.safe -= 0.3
    reasoning.push("Suspicious filename detected")
  }

  const sizeInMB = buffer.length / (1024 * 1024)
  if (sizeInMB > 2) {
    scores.nudity += 0.25
    scores.pornographic += 0.15
    scores.safe -= 0.4
    reasoning.push("Medium to large file size (high quality content)")
  } else if (sizeInMB > 1) {
    scores.nudity += 0.15
    scores.safe -= 0.15
    reasoning.push("Medium file size")
  }

  const skinAnalysis = await analyzePixelSkinTone(buffer)
  if (skinAnalysis.skinPercentage > 30) {
    scores.nudity += 0.35
    scores.suggestive += 0.15
    scores.safe -= 0.5
    reasoning.push(`High skin-tone pixel percentage: ${skinAnalysis.skinPercentage.toFixed(1)}%`)
  } else if (skinAnalysis.skinPercentage > 15) {
    scores.nudity += 0.2
    scores.suggestive += 0.1
    scores.safe -= 0.3
    reasoning.push(`Moderate skin-tone pixel percentage: ${skinAnalysis.skinPercentage.toFixed(1)}%`)
  } else if (skinAnalysis.skinPercentage > 5) {
    scores.suggestive += 0.1
    scores.safe -= 0.1
    reasoning.push(`Some skin-tone pixels detected: ${skinAnalysis.skinPercentage.toFixed(1)}%`)
  }

  const entropy = await calculateEntropy(buffer)
  if (entropy > 7.0) {
    scores.nudity += 0.15
    reasoning.push("High entropy (complex/detailed image)")
  } else if (entropy > 6.0) {
    scores.nudity += 0.1
    reasoning.push("Medium-high entropy")
  }

  const total = Object.values(scores).reduce((a, b) => a + b, 0)
  Object.keys(scores).forEach((key) => {
    scores[key as keyof typeof scores] = Math.max(0, Math.min(1, scores[key as keyof typeof scores] / total))
  })

  let nsfw = false
  let detectedClass = NSFW_CLASSES.SAFE

  if (scores.pornographic > 0.4) {
    detectedClass = NSFW_CLASSES.PORNOGRAPHIC
    nsfw = true
  } else if (scores.sexual_activity > 0.35) {
    detectedClass = NSFW_CLASSES.SEXUAL_ACTIVITY
    nsfw = true
  } else if (scores.nudity > 0.4) {
    detectedClass = NSFW_CLASSES.NUDITY
    nsfw = true
  } else if (scores.suggestive > 0.3) {
    detectedClass = NSFW_CLASSES.SUGGESTIVE
    nsfw = true
  }

  const confidence = Math.max(...Object.values(scores))

  return {
    isNsfw: nsfw,
    class: detectedClass,
    scores,
    confidence,
    method: "local",
    details: {
      mimeType,
      fileSize: buffer.length,
      aspect: metadata.ratio,
      reasoning,
    },
  }
}

// 7. Main NSFW Detection with Fallback
export async function detectNSFWContent(
  buffer: Buffer,
  mimeType: string,
  filename?: string,
): Promise<NSFWAnalysisResult> {
  if (!(await validateMimeType(mimeType))) {
    return {
      isNsfw: false,
      class: NSFW_CLASSES.SAFE,
      scores: { safe: 1, suggestive: 0, nudity: 0, sexual_activity: 0, pornographic: 0 },
      confidence: 1,
      method: "local",
      details: {
        mimeType,
        fileSize: buffer.length,
        reasoning: ["Unsupported MIME type - assumed safe"],
      },
    }
  }

  if (!(await validateFileSize(buffer, mimeType))) {
    return {
      isNsfw: false,
      class: NSFW_CLASSES.SAFE,
      scores: { safe: 1, suggestive: 0, nudity: 0, sexual_activity: 0, pornographic: 0 },
      confidence: 1,
      method: "local",
      details: {
        mimeType,
        fileSize: buffer.length,
        reasoning: ["File size exceeds limits - rejected"],
      },
    }
  }

  const localResult = await analyzeLocalNSFW(buffer, mimeType, filename)

  if (localResult.confidence > 0.8) {
    return localResult
  }

  try {
    const googleResult = await detectAdultContentWithGoogle(buffer)
    if (googleResult.isNsfw) {
      return {
        ...googleResult,
        method: "combined",
        details: {
          ...googleResult.details,
          reasoning: [...localResult.details.reasoning, "Google Cloud Vision confirmed NSFW"],
        },
      }
    }
  } catch (error) {
    console.error("[NSFW] Google Vision fallback failed:", error)
  }

  return localResult
}
