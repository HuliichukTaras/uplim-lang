import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reportedUserId, conversationId, reason } = await request.json()

    if (!reportedUserId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { error } = await supabase.from("spam_reports").insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      conversation_id: conversationId,
      reason: reason || "spam",
    })

    if (error) {
      return NextResponse.json({ error: "Failed to report" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reporting user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
