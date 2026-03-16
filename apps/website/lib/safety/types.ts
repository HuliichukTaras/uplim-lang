export interface ContentAnalysisFlags {
  csam: boolean
  bestiality: boolean
  explicit_sexual_activity: boolean
  full_nudity: boolean
  violence: boolean
  gore: boolean
  dismemberment: boolean
  child: boolean
  animal: boolean
}

export interface ContentAnalysisScores {
  safe: number
  suggestive: number
  nudity: number
  sexual_activity: number
  violence: number
  gore: number
}

export interface ContentAnalysisResult {
  decision: "block" | "review" | "allow"
  reason: string
  confidence: number
  flags: ContentAnalysisFlags
  scores: ContentAnalysisScores
}

export interface SafetyPolicy {
  csam_threshold: number // ZERO tolerance
  bestiality_threshold: number // ZERO tolerance
  explicit_sexual_activity_threshold: number
  full_nudity_threshold: number
  violence_threshold: number
  gore_threshold: number
  suggestive_threshold: number
}
