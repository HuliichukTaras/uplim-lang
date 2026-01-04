import { createServiceClient } from "@/lib/supabase/server"
import type { CreateNotificationEventInput, NotificationEventType, NotificationEntityType } from "./types"

/**
 * NotificationEventService
 * Handles event ingestion and in-app notification aggregation
 */
export class NotificationEventService {
  private supabase = createServiceClient()

  /**
   * Create a notification event and aggregate into in-app notification
   * Uses the aggregate_notification_event DB function for atomic operation
   */
  async createEvent(
    input: CreateNotificationEventInput,
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      const { data, error } = await this.supabase.rpc("aggregate_notification_event", {
        p_recipient_id: input.recipientId,
        p_actor_id: input.actorId,
        p_type: input.type,
        p_entity_type: input.entityType,
        p_entity_id: input.entityId,
        p_metadata: input.metadata || {},
        p_is_sensitive: input.isSensitive || false,
      })

      if (error) {
        console.error("[NotificationEventService] Error creating event:", error)
        return { success: false, error: error.message }
      }

      return { success: true, notificationId: data }
    } catch (err) {
      console.error("[NotificationEventService] Exception:", err)
      return { success: false, error: String(err) }
    }
  }

  /**
   * Batch create events (e.g., for notifying all followers of a new post)
   */
  async createBatchEvents(inputs: CreateNotificationEventInput[]): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0

    for (const input of inputs) {
      const result = await this.createEvent(input)
      if (result.success) {
        success++
      } else {
        failed++
      }
    }

    return { success, failed }
  }

  // ============================================
  // Convenience methods for common event types
  // ============================================

  async notifyLike(postOwnerId: string, likerId: string, postId: string, isSensitive = false) {
    // Don't notify yourself
    if (postOwnerId === likerId) return { success: true }

    return this.createEvent({
      recipientId: postOwnerId,
      actorId: likerId,
      type: "like",
      entityType: "post",
      entityId: postId,
      isSensitive,
    })
  }

  async notifyComment(
    postOwnerId: string,
    commenterId: string,
    postId: string,
    commentId: string,
    commentPreview: string,
    isSensitive = false,
  ) {
    if (postOwnerId === commenterId) return { success: true }

    return this.createEvent({
      recipientId: postOwnerId,
      actorId: commenterId,
      type: "comment",
      entityType: "post",
      entityId: postId,
      metadata: { commentId, commentPreview: commentPreview.slice(0, 100) },
      isSensitive,
    })
  }

  async notifyFollow(userId: string, followerId: string) {
    if (userId === followerId) return { success: true }

    return this.createEvent({
      recipientId: userId,
      actorId: followerId,
      type: "follow",
      entityType: "profile",
      entityId: userId,
    })
  }

  async notifySubscribe(creatorId: string, subscriberId: string, subscriptionId: string) {
    if (creatorId === subscriberId) return { success: true }

    return this.createEvent({
      recipientId: creatorId,
      actorId: subscriberId,
      type: "subscribe",
      entityType: "subscription",
      entityId: subscriptionId,
    })
  }

  async notifyUnlock(creatorId: string, buyerId: string, postId: string, amount: number, currency = "EUR") {
    if (creatorId === buyerId) return { success: true }

    return this.createEvent({
      recipientId: creatorId,
      actorId: buyerId,
      type: "unlock",
      entityType: "post",
      entityId: postId,
      metadata: { amount, currency },
    })
  }

  async notifyTip(creatorId: string, tipperId: string, amount: number, currency = "EUR", message?: string) {
    if (creatorId === tipperId) return { success: true }

    return this.createEvent({
      recipientId: creatorId,
      actorId: tipperId,
      type: "tip",
      entityType: "profile",
      entityId: creatorId,
      metadata: { amount, currency, message: message?.slice(0, 200) },
    })
  }

  async notifyNewPost(followerId: string, creatorId: string, postId: string, isSensitive = false) {
    return this.createEvent({
      recipientId: followerId,
      actorId: creatorId,
      type: "post_created",
      entityType: "post",
      entityId: postId,
      isSensitive,
    })
  }

  async notifyMessage(recipientId: string, senderId: string, conversationId: string, messagePreview: string) {
    if (recipientId === senderId) return { success: true }

    return this.createEvent({
      recipientId,
      actorId: senderId,
      type: "message",
      entityType: "message",
      entityId: conversationId,
      metadata: { messagePreview: messagePreview.slice(0, 50) },
    })
  }

  /**
   * Notify all followers of a creator about a new post
   */
  async notifyFollowersOfNewPost(creatorId: string, postId: string, isSensitive = false) {
    // Get all followers
    const { data: followers, error } = await this.supabase
      .from("follows")
      .select("follower_id")
      .eq("following_id", creatorId)

    if (error || !followers) {
      console.error("[NotificationEventService] Error fetching followers:", error)
      return { success: 0, failed: 0 }
    }

    const inputs: CreateNotificationEventInput[] = followers.map((f) => ({
      recipientId: f.follower_id,
      actorId: creatorId,
      type: "post_created" as NotificationEventType,
      entityType: "post" as NotificationEntityType,
      entityId: postId,
      isSensitive,
    }))

    return this.createBatchEvents(inputs)
  }
}

// Singleton instance
export const notificationEventService = new NotificationEventService()
