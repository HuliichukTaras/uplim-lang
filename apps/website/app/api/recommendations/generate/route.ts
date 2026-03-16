// Generate personalized recommendation queue
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { RankingEngine } from "@/lib/recommendation/ranking-engine"
import { RECOMMENDATION_CONFIG } from "@/lib/recommendation/config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("cold_start_completed, adult_content_affinity")
      .eq("user_id", user.id)
      .single()

    const isColdStart = !prefs || !prefs.cold_start_completed

    const { data: seenPosts } = await supabase
      .from("seen_posts")
      .select("post_id")
      .eq("user_id", user.id)
      .gte("seen_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    const seenPostIds = seenPosts?.map((p) => p.post_id) || []

    let query = supabase
      .from("posts")
      .select("id, user_id, is_nsfw, tags, content_type, created_at")
      .not("id", "in", `(${seenPostIds.join(",") || "null"})`)
      .limit(200)

    if (isColdStart) {
      query = query
        .order("likes_count", { ascending: false })
        .order("created_at", { ascending: false })

      // Avoid adult content for cold start
      if (RECOMMENDATION_CONFIG.coldStart.avoidAdult) {
        query = query.eq("is_nsfw", false)
      }
    } else {
      // Personalized: get diverse content
      query = query.order("created_at", { ascending: false })

      // Filter adult content based on user affinity
      const adultAffinity = prefs?.adult_content_affinity || 0
      if (adultAffinity < 0.3) {
        query = query.eq("is_nsfw", false)
      }
    }

    const { data: posts, error } = await query

    if (error || !posts) {
      throw error
    }

    const rankedPosts = await Promise.all(
      posts.map((post) =>
        RankingEngine.calculateScore({
          userId: user.id,
          postId: post.id,
          isAdult: post.is_nsfw || false,
          creatorId: post.user_id,
          tags: post.tags || [],
          contentType: post.content_type || "image",
          createdAt: post.created_at,
        })
      )
    )

    const sortedPosts = rankedPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, RECOMMENDATION_CONFIG.queue.size)

    const postIds = sortedPosts.map((p) => p.postId)

    await supabase.from("recommendation_queue").insert({
      user_id: user.id,
      post_ids: postIds,
      algorithm_version: "v1",
      expires_at: new Date(Date.now() + RECOMMENDATION_CONFIG.queue.expiryTime * 1000).toISOString(),
    })

    return NextResponse.json({
      success: true,
      count: postIds.length,
      isColdStart,
    })
  } catch (error) {
    console.error("[v0] Generate recommendations error:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}
