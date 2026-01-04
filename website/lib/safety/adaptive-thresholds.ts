import type { SafetyPolicy } from "./types"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

interface ModerationFeedback {
  contentId: string
  systemDecision: "block" | "review" | "allow"
  moderatorDecision: "block" | "review" | "allow"
  systemScore: number
  category: string
  timestamp: Date
}

const BASE_POLICY: SafetyPolicy = {
  csam_threshold: 0,
  bestiality_threshold: 0,
  explicit_sexual_activity_threshold: 0.35,
  full_nudity_threshold: 0.4,
  violence_threshold: 0.75,
  gore_threshold: 0.8,
  suggestive_threshold: 0.3,
}

export async function getAdaptivePolicy(): Promise<SafetyPolicy> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      },
    )

    const { data, error } = await supabase.from("moderation_policies").select("thresholds").single()

    if (error || !data) {
      return BASE_POLICY
    }

    return data.thresholds || BASE_POLICY
  } catch {
    return BASE_POLICY
  }
}

export async function recordModerationFeedback(feedback: ModerationFeedback): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      },
    )

    const { error } = await supabase.from("moderation_feedback_log").insert({
      content_id: feedback.contentId,
      system_decision: feedback.systemDecision,
      moderator_decision: feedback.moderatorDecision,
      system_score: feedback.systemScore,
      category: feedback.category,
      recorded_at: new Date().toISOString(),
      is_correct: feedback.systemDecision === feedback.moderatorDecision,
    })

    return !error
  } catch {
    return false
  }
}

export async function calculatePolicyAdjustments(): Promise<Partial<SafetyPolicy>> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      },
    )

    const { data: errors } = await supabase
      .from("moderation_feedback_log")
      .select("*")
      .eq("is_correct", false)
      .gte("recorded_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    if (!errors || errors.length < 10) {
      return {}
    }

    const adjustments: Partial<SafetyPolicy> = {}

    // Analyze false negatives (should block but allowed)
    const falseNegatives = errors.filter((e) => e.system_decision === "allow" && e.moderator_decision === "block")
    if (falseNegatives.length > errors.length * 0.2) {
      // Lower thresholds if too many false negatives
      adjustments.full_nudity_threshold = Math.max(0.2, BASE_POLICY.full_nudity_threshold - 0.05)
      adjustments.suggestive_threshold = Math.max(0.1, BASE_POLICY.suggestive_threshold - 0.05)
    }

    return adjustments
  } catch {
    return {}
  }
}
