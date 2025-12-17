import type { ContentAnalysisScores } from "./types"

function analyzeColorDistribution(buffer: Buffer): { redRatio: number; darkRatio: number } {
  const sampleSize = Math.min(4096, buffer.length)
  let redPixels = 0
  let darkPixels = 0
  let totalPixels = 0

  for (let i = 0; i < sampleSize; i += 3) {
    if (i + 2 >= buffer.length) break

    const r = buffer[i]
    const g = buffer[i + 1]
    const b = buffer[i + 2]

    // Count red-dominant pixels (blood-like)
    if (r > 150 && r > g + 40 && r > b + 40) {
      redPixels++
    }

    // Count very dark pixels (possible violence/gore scenes)
    if (r < 50 && g < 50 && b < 50) {
      darkPixels++
    }

    totalPixels++
  }

  return {
    redRatio: totalPixels > 0 ? redPixels / totalPixels : 0,
    darkRatio: totalPixels > 0 ? darkPixels / totalPixels : 0,
  }
}

export async function detectViolence(buffer: Buffer): Promise<ContentAnalysisScores> {
  const { redRatio, darkRatio } = analyzeColorDistribution(buffer)

  // Simple heuristic: high red ratio + high dark ratio might indicate blood/violence
  let violenceScore = 0

  if (redRatio > 0.15 && darkRatio > 0.2) {
    violenceScore = 0.6 // Medium confidence violence
  } else if (redRatio > 0.25) {
    violenceScore = 0.7 // Higher confidence (lots of red)
  }

  return {
    safe: Math.max(0, 1 - violenceScore),
    suggestive: 0,
    nudity: 0,
    sexual_activity: 0,
  }
}
