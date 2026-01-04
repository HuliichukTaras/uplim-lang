import type { ContentAnalysisFlags, ContentAnalysisScores, ContentAnalysisResult, SafetyPolicy } from "./types"

const DEFAULT_POLICY: SafetyPolicy = {
  csam_threshold: 0,
  bestiality_threshold: 0,
  explicit_sexual_activity_threshold: 0.35,
  full_nudity_threshold: 0.4,
  violence_threshold: 0.75,
  gore_threshold: 0.8,
  suggestive_threshold: 0.3,
}

export function makePolicyDecision(
  flags: ContentAnalysisFlags,
  scores: ContentAnalysisScores,
  policy: SafetyPolicy = DEFAULT_POLICY,
): ContentAnalysisResult {
  // Hard blocks - ZERO tolerance, no review
  if (flags.csam) {
    return {
      decision: "block",
      reason: "csam_detected",
      confidence: 1.0,
      flags,
      scores,
    }
  }

  if (flags.bestiality) {
    return {
      decision: "block",
      reason: "bestiality_detected",
      confidence: 1.0,
      flags,
      scores,
    }
  }

  // Explicit sexual activity
  if (scores.sexual_activity > policy.explicit_sexual_activity_threshold) {
    return {
      decision: "block",
      reason: "explicit_sexual_activity",
      confidence: scores.sexual_activity,
      flags,
      scores,
    }
  }

  // Full nudity
  if (scores.nudity > policy.full_nudity_threshold) {
    return {
      decision: "block",
      reason: "full_nudity",
      confidence: scores.nudity,
      flags,
      scores,
    }
  }

  // Violence / Gore
  if (flags.gore || scores.gore > policy.gore_threshold) {
    return {
      decision: "block",
      reason: "gore_detected",
      confidence: Math.max(scores.nudity, 0.8),
      flags,
      scores,
    }
  }

  if (scores.violence > policy.violence_threshold) {
    return {
      decision: "block",
      reason: "violence_detected",
      confidence: scores.violence,
      flags,
      scores,
    }
  }

  // Review tier - suggestive content
  if (scores.suggestive > policy.suggestive_threshold) {
    return {
      decision: "review",
      reason: "suggestive_content",
      confidence: scores.suggestive,
      flags,
      scores,
    }
  }

  // Allow
  return {
    decision: "allow",
    reason: "safe_content",
    confidence: scores.safe,
    flags,
    scores,
  }
}
