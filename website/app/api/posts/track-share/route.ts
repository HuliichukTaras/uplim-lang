import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { postId } = await request.json()

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Increment shares_count
    const { error } = await supabase.rpc("increment_shares_count", {
      post_id: postId,
    })

    if (error) {
      console.error("Error tracking share:", error)
      return NextResponse.json({ error: "Failed to track share" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in track-share route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
