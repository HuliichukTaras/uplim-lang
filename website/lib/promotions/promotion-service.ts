import { createClient } from "@/lib/supabase/server"

export interface Promotion {
  id: string
  post_id: string
  user_id: string
  budget_eur: number
  estimated_views: number
  views_delivered: number
  profile_visits_delivered: number
  status: "pending" | "active" | "completed" | "cancelled" | "blocked_by_policy"
  start_date: string
  end_date?: string
  stripe_payment_intent_id?: string
  created_at: string
  updated_at: string
  posts?: any
  profiles?: any
}

export async function getActivePromotions() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("promotions")
    .select(
      `
      *,
      posts (
        id,
        caption,
        media_urls,
        video_url,
        thumbnail_url,
        is_nsfw,
        is_paid,
        user_id,
        profiles!user_id (
          id,
          display_name,
          handle,
          avatar_url
        )
      )
    `,
    )
    .eq("status", "active")
    .lt("views_delivered", "estimated_views")
    .order("views_delivered", { ascending: true })

  if (error) {
    console.error("Error fetching active promotions:", error)
    return []
  }

  return data || []
}

export async function getPromotionForFeed(
  userId: string | null,
  seenPromotionIds: string[],
): Promise<Promotion | null> {
  const supabase = await createClient()

  let query = supabase
    .from("promotions")
    .select(
      `
      *,
      posts!inner (
        *,
        profiles!user_id (
          id,
          display_name,
          handle,
          avatar_url
        )
      )
    `,
    )
    .eq("status", "active")
    .eq("posts.is_adult", false) // Only non-18+ promoted posts in feed
    .lt("views_delivered", "estimated_views")

  // Don't show user their own promoted posts
  if (userId) {
    query = query.neq("user_id", userId)
  }

  // Exclude recently seen promotions in this session
  if (seenPromotionIds.length > 0) {
    query = query.not("id", "in", `(${seenPromotionIds.join(",")})`)
  }

  const { data, error } = await query.order("views_delivered", { ascending: true }).limit(1).single()

  if (error || !data) {
    return null
  }

  return data
}

export async function trackPromotionImpression(promotionId: string, viewerId: string | null, sessionId: string) {
  const supabase = await createClient()

  // Insert impression
  await supabase.from("promotion_impressions").insert({
    promotion_id: promotionId,
    viewer_id: viewerId,
    session_id: sessionId,
  })

  // Increment views_delivered
  const { data: promotion } = await supabase.from("promotions").select("views_delivered").eq("id", promotionId).single()

  if (promotion) {
    await supabase
      .from("promotions")
      .update({
        views_delivered: promotion.views_delivered + 1,
      })
      .eq("id", promotionId)
  }
}

export async function getUserPromotions(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("promotions")
    .select(
      `
      *,
      posts (
        id,
        caption,
        media_urls,
        video_url,
        thumbnail_url,
        is_nsfw,
        views_count,
        likes_count,
        comments_count
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching user promotions:", error)
    return []
  }

  return data || []
}

export async function getPromotionById(promotionId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("promotions")
    .select(
      `
      *,
      posts (
        *,
        profiles!user_id (
          id,
          display_name,
          handle,
          avatar_url
        )
      )
    `,
    )
    .eq("id", promotionId)
    .single()

  if (error) {
    console.error("Error fetching promotion:", error)
    return null
  }

  return data
}

export async function getPromotionImpressions(promotionId: string, limit = 50) {
  const supabase = await createClient()

  const { data: impressions, error } = await supabase
    .from("promotion_impressions")
    .select("*")
    .eq("promotion_id", promotionId)
    .order("timestamp", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching promotion impressions:", error)
    return []
  }

  if (!impressions || impressions.length === 0) {
    return []
  }

  // Fetch profiles for viewers separately
  const viewerIds = impressions.filter((imp) => imp.viewer_id).map((imp) => imp.viewer_id)

  if (viewerIds.length === 0) {
    return impressions.map((imp) => ({ ...imp, profiles: null }))
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, handle, avatar_url")
    .in("id", viewerIds)

  // Map profiles back to impressions
  const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || [])

  return impressions.map((imp) => ({
    ...imp,
    profiles: imp.viewer_id ? profilesMap.get(imp.viewer_id) || null : null,
  }))
}

export async function checkPromotionPostStatus(promotionId: string) {
  const supabase = await createClient()

  const { data: promotion } = await supabase
    .from("promotions")
    .select(`
      *,
      posts!inner (
        is_adult
      )
    `)
    .eq("id", promotionId)
    .single()

  if (promotion && promotion.posts.is_adult && promotion.status === "active") {
    // Pause promotion if post becomes 18+
    await supabase
      .from("promotions")
      .update({
        status: "blocked_by_policy",
        end_date: new Date().toISOString(),
      })
      .eq("id", promotionId)
  }
}
