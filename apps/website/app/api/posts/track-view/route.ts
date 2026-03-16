import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json()

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get current user (can be null for anonymous)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id || null

    // If same user views same post again, it's silently ignored (UPSERT behavior)
    const { error } = await supabase
      .from("post_views")
      .insert({
        post_id: postId,
        user_id: userId,
      })
      .select()

    if (error && error.code !== "23505") {
      // 23505 = unique violation (duplicate view, which is expected/ignored)
      console.error("[v0] Error recording view:", error)
    }

    const { error: updateError } = await supabase
      .from("posts")
      .update({
        views_count:
          (await supabase.from("post_views").select("id", { count: "exact" }).eq("post_id", postId)).count || 0,
      })
      .eq("id", postId)

    if (updateError) {
      console.error("[v0] Error updating views count:", updateError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in track-view route:", error)
    return NextResponse.json({ success: true })
  }
}
