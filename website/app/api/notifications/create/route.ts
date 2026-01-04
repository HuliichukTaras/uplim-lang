import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { notificationEventService } from "@/lib/notifications/event-service"
import { notificationService } from "@/lib/email/notification-service"
import type { NotificationEventType, NotificationEntityType } from "@/lib/notifications/types"

export async function POST(request: Request) {
  try {
    const { userId, actorId, type, metadata } = await request.json()

    if (!userId || !type) {
      return NextResponse.json({ error: "userId and type are required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (actorId && actorId !== user.id) {
      return NextResponse.json({ error: "Cannot create notifications for other users" }, { status: 403 })
    }

    const effectiveActorId = actorId || user.id

    // Don't notify yourself
    if (userId === effectiveActorId) {
      return NextResponse.json({ success: true, skipped: true })
    }

    // Map old notification types to new event types
    const typeMap: Record<string, { eventType: NotificationEventType; entityType: NotificationEntityType }> = {
      new_like: { eventType: "like", entityType: "post" },
      new_comment: { eventType: "comment", entityType: "post" },
      new_follower: { eventType: "follow", entityType: "profile" },
      new_subscriber: { eventType: "subscribe", entityType: "subscription" },
      new_message: { eventType: "message", entityType: "message" },
      content_unlocked: { eventType: "unlock", entityType: "post" },
      purchase: { eventType: "unlock", entityType: "post" },
      new_share: { eventType: "view", entityType: "post" },
    }

    const mappedType = typeMap[type]

    if (mappedType) {
      // Use new event service for aggregation
      const result = await notificationEventService.createEvent({
        recipientId: userId,
        actorId: effectiveActorId,
        type: mappedType.eventType,
        entityType: mappedType.entityType,
        entityId: metadata?.postId || metadata?.conversationId || effectiveActorId,
        metadata: metadata || {},
        isSensitive: metadata?.is_sensitive || metadata?.is_nsfw || false,
      })

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }

      try {
        switch (type) {
          case "new_follower":
            await notificationService.notifyNewFollower(userId, effectiveActorId)
            break
          case "new_like":
            if (metadata?.postId) {
              await notificationService.notifyNewLike(userId, effectiveActorId, metadata.postId)
            }
            break
          case "new_comment":
            if (metadata?.postId) {
              await notificationService.notifyNewComment(
                userId,
                effectiveActorId,
                metadata.content || "New comment",
                metadata.postId,
              )
            }
            break
          case "purchase":
          case "content_unlocked":
            if (metadata?.postId && metadata?.amount) {
              await notificationService.notifyPurchase(userId, effectiveActorId, metadata.amount, metadata.postId)
            }
            break
        }
      } catch (emailError) {
        console.error("[Fantikx] Email notification error:", emailError)
        // Don't fail the request if email fails
      }

      return NextResponse.json({ success: true, notificationId: result.notificationId })
    }

    // Fallback for unmapped types - create notification directly
    const serviceClient = createServiceClient()
    const { data, error } = await serviceClient
      .from("notifications")
      .insert({
        user_id: userId,
        actor_id: effectiveActorId,
        type,
        metadata: metadata || {},
      })
      .select()
      .single()

    if (error) {
      console.error("[Fantikx] Error creating notification:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, notification: data })
  } catch (error) {
    console.error("[Fantikx] Unexpected error in POST /api/notifications/create:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
