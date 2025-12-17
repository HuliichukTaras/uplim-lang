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

    const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false)

    if (error) {
      console.error("[v0] Error marking all notifications as read:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Unexpected error in POST /api/notifications/mark-all-read:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
