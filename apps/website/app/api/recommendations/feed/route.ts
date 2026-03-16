// Get personalized feed from recommendation queue
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const { data: queue } = await supabase
      .from("recommendation_queue")
      .select("post_ids, generated_at, expires_at")
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .order("generated_at", { ascending: false })
      .limit(1)
      .single()

    if (!queue || !queue.post_ids || queue.post_ids.length === 0) {
      return NextResponse.json({
        posts: [],
        needsRegeneration: true,
      })
    }

    const postIds = queue.post_ids.slice(offset, offset + limit)

    const { data: posts, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        profiles:user_id (id, display_name, handle, avatar_url, is_creator),
        likes!left(user_id),
        _count:likes(count)
      `
      )
      .in("id", postIds)

    if (error) throw error

    const seenRecords = postIds.map((postId: string) => ({
      user_id: user.id,
      post_id: postId,
    }))

    await supabase.from("seen_posts").upsert(seenRecords, {
      onConflict: "user_id,post_id",
    })

    const transformedPosts = posts?.map((post: any) => ({
      ...post,
      likes_count: post._count?.[0]?.count || 0,
      has_liked: post.likes?.some((like: any) => like.user_id === user.id) || false,
    }))

    return NextResponse.json({
      posts: transformedPosts || [],
      hasMore: offset + limit < queue.post_ids.length,
      needsRegeneration: false,
    })
  } catch (error) {
    console.error("[v0] Get feed error:", error)
    return NextResponse.json({ error: "Failed to get feed" }, { status: 500 })
  }
}
