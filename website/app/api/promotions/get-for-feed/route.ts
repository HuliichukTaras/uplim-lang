import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { seenPromotionIds = [] } = await request.json()

    // Get current user (if logged in)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let query = supabase
      .from("promotions")
      .select(`
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
      `)
      .eq("status", "active")
      .eq("posts.is_adult", false) // Only non-18+ posts

    // Don't show user their own promoted posts
    if (user) {
      query = query.neq("user_id", user.id)
    }

    // Exclude recently seen promotions
    if (seenPromotionIds.length > 0) {
      query = query.not("id", "in", `(${seenPromotionIds.join(",")})`)
    }

    const { data: promotions, error } = await query.order("views_delivered", { ascending: true })

    if (error || !promotions || promotions.length === 0) {
      return NextResponse.json({ promotion: null })
    }

    const eligiblePromotions = promotions.filter((promo) => promo.views_delivered < promo.estimated_views)

    if (eligiblePromotions.length === 0) {
      return NextResponse.json({ promotion: null })
    }

    // Get the first eligible promotion (already sorted by views_delivered asc)
    const data = eligiblePromotions[0]

    // Check if post became 18+ after promotion started
    if (data.posts.is_adult) {
      // Auto-pause this promotion
      await supabase
        .from("promotions")
        .update({
          status: "blocked_by_policy",
          end_date: new Date().toISOString(),
        })
        .eq("id", data.id)

      return NextResponse.json({ promotion: null })
    }

    return NextResponse.json({ promotion: data })
  } catch (error) {
    console.error("[v0] Error getting promotion for feed:", error)
    return NextResponse.json({ promotion: null })
  }
}
