// Core Ranking Engine
import { createClient } from "@/lib/supabase/server"
import { RECOMMENDATION_CONFIG } from "./config"

interface RankingInput {
  userId: string
  postId: string
  isAdult: boolean
  creatorId: string
  tags: string[]
  contentType: string
  createdAt: string
}

interface RankedPost extends RankingInput {
  score: number
  breakdown: {
    userSignal: number
    contentSimilarity: number
    creatorAffinity: number
    trending: number
  }
}

export class RankingEngine {
  /**
   * Calculate final ranking score for a post
   */
  static async calculateScore(input: RankingInput): Promise<RankedPost> {
    const supabase = await createClient()

    const [userSignalScore, contentSimilarityScore, creatorAffinityScore, trendingScore] =
      await Promise.all([
        this.getUserSignalScore(input.userId, input.postId),
        this.getContentSimilarityScore(input.userId, input.postId, input.tags),
        this.getCreatorAffinityScore(input.userId, input.creatorId),
        this.getTrendingScore(input.postId, input.createdAt),
      ])

    const finalScore =
      userSignalScore * RECOMMENDATION_CONFIG.ranking.user_signal +
      contentSimilarityScore * RECOMMENDATION_CONFIG.ranking.content_similarity +
      creatorAffinityScore * RECOMMENDATION_CONFIG.ranking.creator_affinity +
      trendingScore * RECOMMENDATION_CONFIG.ranking.trending

    return {
      ...input,
      score: finalScore,
      breakdown: {
        userSignal: userSignalScore,
        contentSimilarity: contentSimilarityScore,
        creatorAffinity: creatorAffinityScore,
        trending: trendingScore,
      },
    }
  }

  /**
   * Get user signal score (interactions with similar content)
   */
  private static async getUserSignalScore(userId: string, postId: string): Promise<number> {
    const supabase = await createClient()

    try {
      const { data: signals } = await supabase
        .from("user_signal_events")
        .select("event_type")
        .eq("user_id", userId)
        .gte("timestamp", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(100)

      if (!signals || signals.length === 0) return 0

      let score = 0
      for (const signal of signals) {
        score += RECOMMENDATION_CONFIG.weights[signal.event_type as keyof typeof RECOMMENDATION_CONFIG.weights] || 0
      }

      return Math.min(score / 10, 100) // Normalize to 0-100
    } catch (error) {
      console.error("[v0] Failed to get user signal score:", error)
      return 0
    }
  }

  /**
   * Get content similarity score (hashtag/category matching)
   */
  private static async getContentSimilarityScore(
    userId: string,
    postId: string,
    tags: string[]
  ): Promise<number> {
    const supabase = await createClient()

    try {
      if (!tags || tags.length === 0) return 0

      const { data: affinities } = await supabase
        .from("hashtag_affinity")
        .select("hashtag, score")
        .eq("user_id", userId)
        .in("hashtag", tags)

      if (!affinities || affinities.length === 0) return 0

      const totalScore = affinities.reduce((sum, aff) => sum + Number(aff.score), 0)
      return Math.min(totalScore / tags.length, 100) // Normalize
    } catch (error) {
      console.error("[v0] Failed to get content similarity score:", error)
      return 0
    }
  }

  /**
   * Get creator affinity score
   */
  private static async getCreatorAffinityScore(userId: string, creatorId: string): Promise<number> {
    const supabase = await createClient()

    try {
      const { data: affinity } = await supabase
        .from("creator_affinity")
        .select("score")
        .eq("user_id", userId)
        .eq("creator_id", creatorId)
        .single()

      return affinity ? Math.min(Number(affinity.score), 100) : 0
    } catch (error) {
      return 0
    }
  }

  /**
   * Get trending score based on velocity
   */
  private static async getTrendingScore(postId: string, createdAt: string): Promise<number> {
    const supabase = await createClient()

    try {
      const postAge = Date.now() - new Date(createdAt).getTime()
      const ageInHours = postAge / (1000 * 60 * 60)

      const { count } = await supabase
        .from("user_signal_events")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId)
        .gte("timestamp", new Date(Date.now() - 60 * 60 * 1000).toISOString())

      const velocity = (count || 0) / Math.max(ageInHours, 0.1)

      // Boost recent viral content
      if (velocity > 10 && ageInHours < 24) {
        return 100
      }

      return Math.min(velocity * 10, 100)
    } catch (error) {
      return 0
    }
  }
}
