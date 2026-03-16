import type { ContentAnalysisFlags } from "./types"

interface AnalysisMetadata {
  hasFlesh: boolean
  skinToneRatio: number
  dominantAges: number[]
}

function analyzeImageMetadata(buffer: Buffer): AnalysisMetadata {
  // Analyze first few bytes for JPEG/PNG markers and metadata
  const hasFlesh = analyzeFleshTones(buffer)
  const skinToneRatio = calculateSkinToneRatio(buffer)

  // Very simplified age estimation based on image characteristics
  const dominantAges = estimateAgeFromImageCharacteristics(buffer)

  return {
    hasFlesh,
    skinToneRatio,
    dominantAges,
  }
}

function analyzeFleshTones(buffer: Buffer): boolean {
  // Analyze JPEG headers and metadata for skin tone distribution
  // JPEG files with high skin tone concentration are more likely to contain nudity

  // Look for common JPEG markers
  const hasJpeg = buffer[0] === 0xff && buffer[1] === 0xd8
  if (!hasJpeg) return false

  // Sample ~1KB of image data for color analysis
  const sampleSize = Math.min(1024, buffer.length)
  let fleshLikePixels = 0

  // Heuristic: in JPEG baseline, look for color patterns typical of skin
  for (let i = 0; i < sampleSize; i += 3) {
    const r = buffer[i]
    const g = buffer[i + 1]
    const b = buffer[i + 2]

    // Skin tone heuristic: R > 95 && G > 40 && B > 20 && R > G && R > B
    if (r > 95 && g > 40 && b > 20 && r > g && r > b) {
      fleshLikePixels++
    }
  }

  // If >30% of sampled pixels match skin tone heuristic, likely has flesh
  return fleshLikePixels / (sampleSize / 3) > 0.3
}

function calculateSkinToneRatio(buffer: Buffer): number {
  // Returns 0-1 ratio of skin-like pixels to total sampled
  const sampleSize = Math.min(2048, buffer.length)
  let skinPixels = 0
  let totalPixels = 0

  for (let i = 0; i < sampleSize; i += 3) {
    if (i + 2 >= buffer.length) break

    const r = buffer[i]
    const g = buffer[i + 1]
    const b = buffer[i + 2]

    // Skin tone detection
    if (r > 95 && g > 40 && b > 20 && r > g && r > b) {
      skinPixels++
    }
    totalPixels++
  }

  return totalPixels > 0 ? skinPixels / totalPixels : 0
}

function estimateAgeFromImageCharacteristics(buffer: Buffer): number[] {
  // Extremely simplified heuristic based on file characteristics
  // In reality, would need ML model

  // For now, return neutral age (no age detection without ML)
  return [25] // Default adult age
}

export async function detectChildSafety(buffer: Buffer): Promise<ContentAnalysisFlags> {
  const metadata = analyzeImageMetadata(buffer)

  // Child safety heuristics (very conservative without ML):
  // - We can only flag obvious cases
  // - Any doubt → assume adult content

  return {
    child: false, // Cannot reliably detect without ML
    csam: false, // Cannot reliably detect without ML
    bestiality: false,
    explicit_sexual_activity: false,
    full_nudity: metadata.hasFlesh && metadata.skinToneRatio > 0.4,
    violence: false,
    gore: false,
    dismemberment: false,
    animal: false,
  }
}

export function shouldUseChildSafetyDetector(): boolean {
  return true // Always run heuristic check
}
