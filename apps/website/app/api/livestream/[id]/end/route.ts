import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const livestreamId = id

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error("[v0] Auth error ending stream:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Ending livestream:", livestreamId, "for user:", user.id)

    const { error: updateError } = await supabase
      .from("livestreams")
      .update({
        is_live: false,
        ended_at: new Date().toISOString(),
      })
      .eq("id", livestreamId)
      .eq("creator_id", user.id)

    if (updateError) {
      console.error("[v0] Error ending livestream:", updateError)
      return NextResponse.json(
        { error: "Failed to end livestream" },
        { status: 500 }
      )
    }

    console.log("[v0] Livestream ended successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] End livestream error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
