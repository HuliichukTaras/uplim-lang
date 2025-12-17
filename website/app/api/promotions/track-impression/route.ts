import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { promotionId, sessionId } = await request.json()

    if (!promotionId || !sessionId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error: insertError } = await supabase.from("promotion_impressions").insert({
      promotion_id: promotionId,
      viewer_id: user?.id || null,
      session_id: sessionId,
    })

    if (insertError) {
      console.error("[v0] Error inserting impression:", insertError)
      // Continue anyway - tracking is not critical
    }

    const { data: promotion, error: selectError } = await supabase
      .from("promotions")
      .select("views_delivered, estimated_views")
      .eq("id", promotionId)
      .single()

    if (!selectError && promotion) {
      const newViewsDelivered = promotion.views_delivered + 1
      const updateData: any = {
        views_delivered: newViewsDelivered,
      }

      // Auto-complete promotion if views target reached
      if (newViewsDelivered >= promotion.estimated_views) {
        updateData.status = "completed"
        updateData.end_date = new Date().toISOString()
      }

      await supabase.from("promotions").update(updateData).eq("id", promotionId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tracking promotion impression:", error)
    // Return success anyway to not break the feed
    return NextResponse.json({ success: true })
  }
}
