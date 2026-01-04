import { createServiceClient } from "@/lib/supabase/server"
import { queueEmail } from "./send-email"
import { emailTemplates } from "./templates"

export class NotificationService {
  private supabase = createServiceClient()

  // Check if user wants this type of email notification
  async shouldSendEmail(userId: string, notificationType: string): Promise<{ shouldSend: boolean; email?: string }> {
    // Get user's email
    const { data: user } = await this.supabase.auth.admin.getUserById(userId)
    if (!user?.user?.email) return { shouldSend: false }

    // Get notification preferences
    const { data: prefs } = await this.supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single()

    // If no preferences set, default to sending
    if (!prefs) return { shouldSend: true, email: user.user.email }

    // Check specific preference
    const prefMap: Record<string, keyof typeof prefs> = {
      new_follower: "email_new_follower",
      new_like: "email_new_like",
      new_comment: "email_new_comment",
      new_message: "email_new_message",
      new_post: "email_new_post_from_following",
      purchase: "email_purchase_notification",
      weekly_digest: "email_weekly_digest",
    }

    const prefKey = prefMap[notificationType]
    if (prefKey && prefs[prefKey] === false) return { shouldSend: false }

    // Check email frequency
    if (prefs.email_frequency === "daily" || prefs.email_frequency === "weekly") {
      // Queue for digest instead of sending immediately
      return { shouldSend: false, email: user.user.email }
    }

    return { shouldSend: true, email: user.user.email }
  }

  async notifyNewFollower(userId: string, followerId: string) {
    const { shouldSend, email } = await this.shouldSendEmail(userId, "new_follower")
    if (!shouldSend || !email) return

    const [{ data: recipient }, { data: follower }] = await Promise.all([
      this.supabase.from("profiles").select("display_name, handle").eq("id", userId).single(),
      this.supabase.from("profiles").select("display_name, handle, avatar_url").eq("id", followerId).single(),
    ])

    if (!follower || !recipient) return

    const recipientName = String(recipient.display_name || recipient.handle || "there")
    const followerName = String(follower.display_name || follower.handle || "Someone")
    const followerHandle = String(follower.handle || "user")

    const template = emailTemplates.newFollower(recipientName, followerName, followerHandle, follower.avatar_url)

    await queueEmail(userId, "new_follower", template.subject, template.html, { followerId })
  }

  async notifyNewLike(postOwnerId: string, likerId: string, postId: string) {
    const { shouldSend, email } = await this.shouldSendEmail(postOwnerId, "new_like")
    if (!shouldSend || !email) return

    const [{ data: recipient }, { data: liker }, { data: post }] = await Promise.all([
      this.supabase.from("profiles").select("display_name, handle").eq("id", postOwnerId).single(),
      this.supabase.from("profiles").select("display_name, handle").eq("id", likerId).single(),
      this.supabase.from("posts").select("caption").eq("id", postId).single(),
    ])

    if (!liker || !recipient) return

    const recipientName = String(recipient.display_name || recipient.handle || "there")
    const likerName = String(liker.display_name || liker.handle || "Someone")
    const postPreview = post?.caption || undefined

    const template = emailTemplates.newLike(recipientName, likerName, postId, postPreview)

    await queueEmail(postOwnerId, "new_like", template.subject, template.html, { likerId, postId })
  }

  async notifyNewComment(postOwnerId: string, commenterId: string, comment: string, postId: string) {
    const { shouldSend, email } = await this.shouldSendEmail(postOwnerId, "new_comment")
    if (!shouldSend || !email) return

    const [{ data: recipient }, { data: commenter }] = await Promise.all([
      this.supabase.from("profiles").select("display_name, handle").eq("id", postOwnerId).single(),
      this.supabase.from("profiles").select("display_name, handle").eq("id", commenterId).single(),
    ])

    if (!commenter || !recipient) return

    const recipientName = String(recipient.display_name || recipient.handle || "there")
    const commenterName = String(commenter.display_name || commenter.handle || "Someone")

    const template = emailTemplates.newComment(recipientName, commenterName, postId, comment)

    await queueEmail(postOwnerId, "new_comment", template.subject, template.html, { commenterId, postId, comment })
  }

  async notifyNewPostFromFollowing(creatorId: string, postId: string, caption?: string) {
    // Get all followers of this creator
    const { data: followers } = await this.supabase.from("follows").select("follower_id").eq("following_id", creatorId)

    if (!followers || followers.length === 0) return

    // Get creator info
    const { data: creator } = await this.supabase
      .from("profiles")
      .select("display_name, handle")
      .eq("id", creatorId)
      .single()

    if (!creator) return

    const creatorName = String(creator.display_name || creator.handle || "A creator")
    const creatorHandle = String(creator.handle || "creator")

    const template = {
      subject: `New post from ${creatorName}`,
      html: emailTemplates.wrapper(
        `
        <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 24px; font-weight: 700;">${creatorName} just posted!</h2>
        <p style="margin: 0 0 28px 0; color: #6b7280; font-size: 15px;">Check out their latest content.</p>
        ${caption ? `<p style="margin: 0 0 28px 0; color: #4b5563; font-size: 15px; font-style: italic;">"${caption.slice(0, 100)}${caption.length > 100 ? "..." : ""}"</p>` : ""}
        ${emailTemplates.button("View Post", `https://fantikx.com/post/${postId}`)}
      `,
        "there",
      ),
    }

    // Queue emails for all followers (batch)
    for (const follower of followers) {
      const { shouldSend, email } = await this.shouldSendEmail(follower.follower_id, "new_post")
      if (shouldSend && email) {
        await queueEmail(follower.follower_id, "new_post", template.subject, template.html, { postId, creatorId })
      }
    }
  }

  async notifyNewMessage(recipientId: string, senderId: string, messagePreview: string) {
    const { shouldSend, email } = await this.shouldSendEmail(recipientId, "new_message")
    if (!shouldSend || !email) return

    const [{ data: recipient }, { data: sender }] = await Promise.all([
      this.supabase.from("profiles").select("display_name, handle").eq("id", recipientId).single(),
      this.supabase.from("profiles").select("display_name, handle").eq("id", senderId).single(),
    ])

    if (!sender || !recipient) return

    const recipientName = String(recipient.display_name || recipient.handle || "there")
    const senderName = String(sender.display_name || sender.handle || "Someone")
    const senderHandle = String(sender.handle || "user")

    const template = emailTemplates.newMessage(recipientName, senderName, senderHandle, messagePreview)

    await queueEmail(recipientId, "new_message", template.subject, template.html, { senderId, messagePreview })
  }

  async notifyPurchase(creatorId: string, buyerId: string, amount: string, postId: string) {
    const { shouldSend, email } = await this.shouldSendEmail(creatorId, "purchase")
    if (!shouldSend || !email) return

    const [{ data: recipient }, { data: buyer }] = await Promise.all([
      this.supabase.from("profiles").select("display_name, handle").eq("id", creatorId).single(),
      this.supabase.from("profiles").select("display_name, handle").eq("id", buyerId).single(),
    ])

    if (!buyer || !recipient) return

    const recipientName = String(recipient.display_name || recipient.handle || "there")
    const buyerName = String(buyer.display_name || buyer.handle || "A user")

    const template = emailTemplates.newPurchase(recipientName, buyerName, postId, Number.parseFloat(amount))

    await queueEmail(creatorId, "purchase", template.subject, template.html, { buyerId, postId, amount })
  }

  async sendWelcomeEmail(userId: string) {
    const { data: user } = await this.supabase.auth.admin.getUserById(userId)
    if (!user?.user?.email) return

    const { data: profile } = await this.supabase
      .from("profiles")
      .select("display_name, handle")
      .eq("id", userId)
      .single()

    const userName = String(profile?.display_name || profile?.handle || "there")
    const template = emailTemplates.welcome(userName)

    await queueEmail(userId, "welcome", template.subject, template.html, { userId })
  }
}

export const notificationService = new NotificationService()
