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
}

export interface ContentAnalysisResult {
  decision: "block" | "review" | "allow"
  reason: string
  confidence: number
  flags: ContentAnalysisFlags
  scores: ContentAnalysisScores
}

export interface SafetyPolicy {
  csam_threshold: 0 // ZERO tolerance
  bestiality_threshold: 0 // ZERO tolerance
  explicit_sexual_activity_threshold: 0.85
  full_nudity_threshold: 0.7
  violence_threshold: 0.75
  gore_threshold: 0.8
  suggestive_threshold: 0.6
}
