// Signal Tracking System
import { createClient } from "@/lib/supabase/server"
import { RECOMMENDATION_CONFIG, type SignalEvent } from "./config"

export class SignalTracker {
  /**
   * Track a user signal event
   */
  static async trackSignal(
    userId: string,
    postId: string,
    eventType: SignalEvent,
    value?: Record<string, any>
  ): Promise<void> {
    const supabase = await createClient()

    try {
      await supabase.from("user_signal_events").insert({
        user_id: userId,
        post_id: postId,
        event_type: eventType,
        value: value || null,
        timestamp: new Date().toISOString(),
      })

      const post = await supabase.from("posts").select("user_id").eq("id", postId).single()

      if (post.data) {
        await this.updateCreatorAffinity(userId, post.data.user_id, eventType)
      }

      await this.updateUserPreferences(userId, eventType, value)
    } catch (error) {
      console.error("[v0] Failed to track signal:", error)
    }
  }

  /**
   * Update creator affinity score
   */
  private static async updateCreatorAffinity(
    userId: string,
    creatorId: string,
    eventType: SignalEvent
  ): Promise<void> {
    const supabase = await createClient()
    const weight = RECOMMENDATION_CONFIG.weights[eventType] || 0

    if (weight === 0 || userId === creatorId) return

    try {
      const { data: existing } = await supabase
        .from("creator_affinity")
        .select("score, interactions_count")
        .eq("user_id", userId)
        .eq("creator_id", creatorId)
        .single()

      if (existing) {
        await supabase
          .from("creator_affinity")
          .update({
            score: existing.score + weight,
            interactions_count: existing.interactions_count + 1,
            last_interaction: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("creator_id", creatorId)
      } else {
        await supabase.from("creator_affinity").insert({
          user_id: userId,
          creator_id: creatorId,
          score: weight,
          interactions_count: 1,
          last_interaction: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("[v0] Failed to update creator affinity:", error)
    }
  }

  /**
   * Update user preferences based on behavior
   */
  private static async updateUserPreferences(
    userId: string,
    eventType: SignalEvent,
    value?: Record<string, any>
  ): Promise<void> {
    const supabase = await createClient()

    try {
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (!prefs) {
        await supabase.from("user_preferences").insert({
          user_id: userId,
          interactions_count: 1,
        })
        return
      }

      const updates: any = {
        interactions_count: prefs.interactions_count + 1,
        updated_at: new Date().toISOString(),
      }

      if (prefs.interactions_count >= RECOMMENDATION_CONFIG.coldStart.minInteractions) {
        updates.cold_start_completed = true
      }

      await supabase.from("user_preferences").update(updates).eq("user_id", userId)
    } catch (error) {
      console.error("[v0] Failed to update user preferences:", error)
    }
  }
}
