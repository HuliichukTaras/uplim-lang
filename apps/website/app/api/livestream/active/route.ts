import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data: livestreams, error } = await supabase
      .from("livestreams")
      .select(`
        *,
        creator:profiles!creator_id (
          id,
          handle,
          display_name,
          avatar_url
        )
      `)
      .eq("is_live", true)
      .order("started_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching livestreams:", error)
      return NextResponse.json(
        { error: "Failed to fetch livestreams" },
        { status: 500 }
      )
    }

    return NextResponse.json({ livestreams })
  } catch (error) {
    console.error("[v0] Get livestreams error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
