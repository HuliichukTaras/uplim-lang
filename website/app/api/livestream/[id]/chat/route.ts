import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()

    console.log("[v0] Fetching chat messages for livestream:", id)

    const { data: messages, error } = await supabase
      .from("livestream_chat")
      .select(`
        *,
        user:profiles!user_id(id, handle, display_name, avatar_url)
      `)
      .eq("livestream_id", id)
      .order("created_at", { ascending: true })
      .limit(100)

    console.log("[v0] Chat messages fetched:", messages?.length, "messages")
    if (error) {
      console.error("[v0] Error fetching chat:", error)
      throw error
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error: any) {
    console.error("[v0] Error fetching chat:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error("[v0] Unauthorized - no user")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { message } = body

    console.log("[v0] User", user.id, "sending message:", message)

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("livestream_chat")
      .insert({
        livestream_id: id,
        user_id: user.id,
        message: message.trim(),
      })
      .select(`
        *,
        user:profiles!user_id(id, handle, display_name, avatar_url)
      `)
      .single()

    console.log("[v0] Message inserted:", data)
    if (error) {
      console.error("[v0] Error inserting message:", error)
      throw error
    }

    return NextResponse.json({ message: data })
  } catch (error: any) {
    console.error("[v0] Error sending chat message:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
