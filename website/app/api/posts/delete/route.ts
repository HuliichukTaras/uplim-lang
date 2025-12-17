import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get("postId")

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    // Verify ownership
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("user_id, media_urls, video_url")
      .eq("id", postId)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    if (post.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized to delete this post" }, { status: 403 })
    }

    // Delete related data first (cascading)
    await supabase.from("likes").delete().eq("post_id", postId)
    await supabase.from("comments").delete().eq("post_id", postId)
    await supabase.from("post_shares").delete().eq("post_id", postId)
    await supabase.from("post_favorites").delete().eq("post_id", postId)
    await supabase.from("post_unlocks").delete().eq("post_id", postId)

    // Delete the post
    const { error: deleteError } = await supabase.from("posts").delete().eq("id", postId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // TODO: Delete media from Blob storage if needed
    // if (post.media_urls?.length > 0 || post.video_url) {
    //   // Delete from blob storage
    // }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete post error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
