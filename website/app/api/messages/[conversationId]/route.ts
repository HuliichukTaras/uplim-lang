import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const { conversationId } = await params

    // Validate UUID to prevent sending invalid input to database
    if (!UUID_REGEX.test(conversationId)) {
      console.log(`[v0] Invalid conversation ID format: ${conversationId}`)
      // If the ID is 'list', it means the static route was missed by Next.js routing for some reason.
      // We return 404 so it doesn't try to query the DB.
      return NextResponse.json({ error: "Invalid conversation ID" }, { status: 404 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Loading messages for conversation:", conversationId, "User:", user.id)

    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // Verify user is participant
    const { data: participation } = await supabaseAdmin
      .from("conversation_participants")
      .select()
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle()

    console.log("[v0] User participation:", participation)

    if (!participation) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get messages with sender info using admin client
    const { data: messages, error } = await supabaseAdmin
      .from("messages")
      .select(
        `
        id,
        content,
        attachments,
        created_at,
        sender_id,
        deleted_for_everyone,
        deleted_by,
        sender:profiles!messages_sender_id_fkey(id, display_name, handle, avatar_url)
      `,
      )
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .not("deleted_by", "cs", `{${user.id}}`) // Simplified query: ensure user hasn't deleted it
      .order("created_at", { ascending: true })

    console.log("[v0] Messages loaded:", messages?.length, "Error:", error)

    if (error) {
      console.error("[v0] Error loading messages:", error)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    // Mark messages as read
    await supabaseAdmin
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error("[v0] Error fetching messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
