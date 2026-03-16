import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { notificationService } from "@/lib/email/notification-service"

async function checkRateLimit(supabaseAdmin: any, userId: string, recipientId: string): Promise<boolean> {
  const { data: rateLimit } = await supabaseAdmin
    .from("message_rate_limits")
    .select("*")
    .eq("user_id", userId)
    .eq("recipient_id", recipientId)
    .maybeSingle()

  const now = new Date()
  const oneMinuteAgo = new Date(now.getTime() - 60000)

  if (!rateLimit) {
    await supabaseAdmin.from("message_rate_limits").insert({
      user_id: userId,
      recipient_id: recipientId,
      message_count: 1,
      window_start: now.toISOString(),
    })
    return true
  }

  const windowStart = new Date(rateLimit.window_start)

  if (windowStart < oneMinuteAgo) {
    await supabaseAdmin
      .from("message_rate_limits")
      .update({ message_count: 1, window_start: now.toISOString() })
      .eq("id", rateLimit.id)
    return true
  }

  if (rateLimit.message_count >= 5) {
    return false
  }

  await supabaseAdmin
    .from("message_rate_limits")
    .update({ message_count: rateLimit.message_count + 1 })
    .eq("id", rateLimit.id)

  return true
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { recipientId, content, attachments } = await request.json()

    if (!recipientId || (!content && (!attachments || attachments.length === 0))) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("[v0] Sending message from", user.id, "to", recipientId)

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

    const { data: existingParticipants } = await supabaseAdmin
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id)

    let conversationId: string | null = null
    let existingConversation: any = null

    if (existingParticipants && existingParticipants.length > 0) {
      for (const cp of existingParticipants) {
        const { data: recipientInConv } = await supabaseAdmin
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", cp.conversation_id)
          .eq("user_id", recipientId)
          .maybeSingle()

        if (recipientInConv) {
          conversationId = cp.conversation_id

          const { data: conv } = await supabaseAdmin
            .from("conversations")
            .select("*")
            .eq("id", cp.conversation_id)
            .single()

          existingConversation = conv
          break
        }
      }
    }

    console.log("[v0] Existing conversation:", conversationId)

    if (existingConversation && existingConversation.status === "blocked") {
      return NextResponse.json({ error: "Cannot send message to this user" }, { status: 403 })
    }

    if (!conversationId || existingConversation?.status === "pending") {
      const canSend = await checkRateLimit(supabaseAdmin, user.id, recipientId)
      if (!canSend) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please wait before sending more messages." },
          { status: 429 },
        )
      }
    }

    if (!conversationId) {
      const { data: newConversation, error: convError } = await supabaseAdmin
        .from("conversations")
        .insert({
          last_message_at: new Date().toISOString(),
          status: "pending",
        })
        .select()
        .single()

      if (convError || !newConversation) {
        console.error("[v0] Error creating conversation:", convError)
        return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
      }

      conversationId = newConversation.id
      console.log("[v0] Created new conversation:", conversationId)

      const { error: participantsError } = await supabaseAdmin.from("conversation_participants").insert([
        { conversation_id: conversationId, user_id: user.id },
        { conversation_id: conversationId, user_id: recipientId },
      ])

      if (participantsError) {
        console.error("[v0] Error adding participants:", participantsError)
        return NextResponse.json({ error: "Failed to add participants" }, { status: 500 })
      }
    }

    const { data: message, error: messageError } = await supabaseAdmin
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content || "",
        attachments: attachments || null,
      })
      .select()
      .single()

    if (messageError || !message) {
      console.error("[v0] Error creating message:", messageError)
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }

    console.log("[v0] Message created:", message.id)

    await supabaseAdmin
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId)

    try {
      // In-app notification
      await supabaseAdmin.from("notifications").insert({
        user_id: recipientId,
        actor_id: user.id,
        type: "new_message",
        group_key: `new_message:conversation:${conversationId}`,
        entity_type: "conversation",
        entity_id: conversationId,
        metadata: {
          conversationId: conversationId,
          messageId: message.id,
        },
      })

      // Insert event for email digests
      await supabaseAdmin.from("notification_events").insert({
        recipient_id: recipientId,
        actor_id: user.id,
        type: "message",
        entity_type: "conversation",
        entity_id: conversationId,
        metadata: { messageId: message.id },
      })

      // Send email notification
      const messagePreview = content ? content.substring(0, 100) : "Sent an attachment"
      await notificationService.notifyNewMessage(recipientId, user.id, messagePreview)
    } catch (notifError) {
      console.error("[v0] Notification error:", notifError)
    }

    return NextResponse.json({ message, conversationId })
  } catch (error) {
    console.error("[v0] Error sending message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
