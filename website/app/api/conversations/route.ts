import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0 API] Loading conversations for user:", user.id)

    const adminClient = createServiceClient()

    const { data: participations, error: partError } = await adminClient
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", user.id)

    console.log("[v0 API] Participations:", participations?.length, "Error:", partError)

    if (partError || !participations) {
      return NextResponse.json({ conversations: [], requests: [] })
    }

    const conversationIds = participations.map((p) => p.conversation_id)

    if (conversationIds.length === 0) {
      console.log("[v0 API] No conversations found")
      return NextResponse.json({ conversations: [], requests: [] })
    }

    const { data: conversations, error: convError } = await adminClient
      .from("conversations")
      .select("id, last_message_at, updated_at, status")
      .in("id", conversationIds)
      .order("last_message_at", { ascending: false })

    console.log("[v0 API] Conversations:", conversations?.length, "Error:", convError)

    if (convError || !conversations) {
      return NextResponse.json({ conversations: [], requests: [] })
    }

    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const { data: participants } = await adminClient
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", conv.id)
          .neq("user_id", user.id)

        const otherUserId = participants?.[0]?.user_id

        let otherProfile = null
        if (otherUserId) {
          const { data: profile } = await adminClient
            .from("profiles")
            .select("id, display_name, handle, avatar_url")
            .eq("id", otherUserId)
            .maybeSingle()

          otherProfile = profile
        }

        // Fallback for missing or deleted users
        const displayUser = otherProfile || {
          id: otherUserId || "deleted",
          display_name: "Unknown User",
          handle: "unknown",
          avatar_url: null,
        }

        const { data: lastMessage } = await adminClient
          .from("messages")
          .select("content, attachments, created_at, sender_id")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        const userParticipation = participations.find((p) => p.conversation_id === conv.id)
        const { count: unreadCount } = await adminClient
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .neq("sender_id", user.id)
          .gt("created_at", userParticipation?.last_read_at || new Date(0).toISOString())
          .not("deleted_by", "cs", `{${user.id}}`) // Simplified query: ensure user hasn't deleted it

        return {
          id: conv.id,
          lastMessageAt: conv.last_message_at,
          otherUser: displayUser,
          lastMessage: lastMessage,
          unreadCount: unreadCount || 0,
          status: conv.status || "accepted",
          isRequest: conv.status === "pending" && lastMessage?.sender_id !== user.id,
        }
      }),
    )

    const uniqueConversations = Array.from(new Map(enrichedConversations.map((c) => [c.id, c])).values())
    const validConversations = uniqueConversations

    console.log("[v0 API] Valid conversations:", validConversations.length)

    const requests = validConversations.filter((c) => c.isRequest && c.status === "pending")
    const accepted = validConversations.filter(
      (c) => c.status === "accepted" || (c.status === "pending" && !c.isRequest),
    )

    return NextResponse.json({ conversations: accepted, requests })
  } catch (error) {
    console.error("[v0 API] Error fetching conversations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
