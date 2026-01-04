import { createServiceClient } from "@/lib/supabase/server"
import {
  dailyDigestTemplate,
  weeklyDigestTemplate,
  winbackTemplate,
  generateEmailUrls,
  type DailyDigestData,
  type WeeklyDigestData,
  type WinbackData,
} from "./templates-v2"
import type { EmailTemplate } from "@/lib/notifications/types"

/**
 * DigestAggregator - Aggregates notification events into email digests
 */
export class DigestAggregator {
  private supabase = createServiceClient()

  /**
   * Process daily digests for users who have enabled them
   * Called by hourly cron job
   */
  async processDailyDigests(): Promise<{ queued: number; skipped: number }> {
    let queued = 0
    let skipped = 0

    // Get users with daily digest enabled and whose digest hour matches current hour in their timezone
    const { data: users, error } = await this.supabase
      .from("notification_preferences")
      .select("user_id, unsubscribe_token, timezone, digest_hour_local")
      .eq("email_daily_enabled", true)
      .is("paused_until", null)

    if (error || !users) {
      console.error("[DigestAggregator] Error fetching users:", error)
      return { queued, skipped }
    }

    for (const user of users) {
      // Check if it's the right hour in user's timezone
      const userHour = this.getHourInTimezone(user.timezone || "UTC")
      if (userHour !== (user.digest_hour_local || 19)) {
        continue
      }

      // Check if we already sent a digest today
      const { data: lastSent } = await this.supabase
        .from("email_send_log")
        .select("sent_at")
        .eq("user_id", user.user_id)
        .eq("template", "daily_digest")
        .order("sent_at", { ascending: false })
        .limit(1)
        .single()

      if (lastSent) {
        const lastSentDate = new Date(lastSent.sent_at)
        const now = new Date()
        const hoursSince = (now.getTime() - lastSentDate.getTime()) / (1000 * 60 * 60)
        if (hoursSince < 20) {
          // Don't send if last digest was less than 20 hours ago
          skipped++
          continue
        }
      }

      // Queue digest for this user
      const result = await this.queueDailyDigest(user.user_id, user.unsubscribe_token)
      if (result) {
        queued++
      } else {
        skipped++
      }
    }

    return { queued, skipped }
  }

  /**
   * Queue a daily digest for a specific user
   */
  private async queueDailyDigest(userId: string, unsubscribeToken: string): Promise<boolean> {
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    // Get unprocessed events from last 24 hours
    const { data: events } = await this.supabase
      .from("notification_events")
      .select("*")
      .eq("recipient_id", userId)
      .is("processed_at", null)
      .gte("created_at", oneDayAgo.toISOString())

    if (!events || events.length === 0) {
      return false // No activity to report
    }

    // Aggregate counts
    const likesCount = events.filter((e) => e.type === "like").length
    const commentsCount = events.filter((e) => e.type === "comment").length
    const followersCount = events.filter((e) => e.type === "follow").length
    const subscribersCount = events.filter((e) => e.type === "subscribe").length
    const totalUpdates = events.length

    // Generate highlights (top events)
    const highlights = await this.generateHighlights(events.slice(0, 5))

    // Build digest data
    const urls = generateEmailUrls(unsubscribeToken)
    const digestData: DailyDigestData = {
      totalUpdates,
      likesCount,
      commentsCount,
      followersCount,
      subscribersCount,
      highlights,
      ctaUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/notifications`,
      ...urls,
    }

    const template = dailyDigestTemplate(digestData)

    // Queue the email
    await this.supabase.from("email_queue").insert({
      user_id: userId,
      email_type: "daily_digest",
      template: "daily_digest" as EmailTemplate,
      subject: template.subject,
      html_content: template.html,
      payload: digestData,
      scheduled_for: new Date().toISOString(),
    })

    // Mark events as processed
    const eventIds = events.map((e) => e.id)
    await this.supabase
      .from("notification_events")
      .update({ processed_at: new Date().toISOString() })
      .in("id", eventIds)

    return true
  }

  /**
   * Process weekly digests for all users
   * Called by weekly cron job (e.g., Sunday evening)
   */
  async processWeeklyDigests(): Promise<{ queued: number; skipped: number }> {
    let queued = 0
    let skipped = 0

    const { data: users, error } = await this.supabase
      .from("notification_preferences")
      .select("user_id, unsubscribe_token, timezone")
      .eq("email_weekly_enabled", true)
      .is("paused_until", null)

    if (error || !users) {
      console.error("[DigestAggregator] Error fetching users:", error)
      return { queued, skipped }
    }

    for (const user of users) {
      const result = await this.queueWeeklyDigest(user.user_id, user.unsubscribe_token)
      if (result) {
        queued++
      } else {
        skipped++
      }
    }

    return { queued, skipped }
  }

  /**
   * Queue a weekly digest for a specific user
   */
  private async queueWeeklyDigest(userId: string, unsubscribeToken: string): Promise<boolean> {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Get stats for the week
    const [likesResult, commentsResult, followersResult, subsResult, earningsResult] = await Promise.all([
      this.supabase
        .from("notification_events")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", userId)
        .eq("type", "like")
        .gte("created_at", oneWeekAgo.toISOString()),
      this.supabase
        .from("notification_events")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", userId)
        .eq("type", "comment")
        .gte("created_at", oneWeekAgo.toISOString()),
      this.supabase
        .from("notification_events")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", userId)
        .eq("type", "follow")
        .gte("created_at", oneWeekAgo.toISOString()),
      this.supabase
        .from("notification_events")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", userId)
        .eq("type", "subscribe")
        .gte("created_at", oneWeekAgo.toISOString()),
      this.supabase.from("wallets").select("total_earned").eq("user_id", userId).single(),
    ])

    const weekLikes = likesResult.count || 0
    const weekComments = commentsResult.count || 0
    const weekNewFollowers = followersResult.count || 0
    const weekNewSubs = subsResult.count || 0
    const weekEarnings = earningsResult.data?.total_earned || 0

    // Skip if no activity
    if (weekLikes === 0 && weekComments === 0 && weekNewFollowers === 0 && weekNewSubs === 0) {
      return false
    }

    // Generate summary
    const weekSummaryTitle =
      weekLikes > 10 ? "Great engagement!" : weekNewFollowers > 5 ? "Growing audience!" : "Here's your recap"

    const urls = generateEmailUrls(unsubscribeToken)
    const digestData: WeeklyDigestData = {
      weekSummaryTitle,
      weeklyIntro: `This week brought ${weekLikes + weekComments} interactions and ${weekNewFollowers} new followers.`,
      weekLikes,
      weekComments,
      weekNewFollowers,
      weekNewSubs,
      weekEarnings: weekEarnings > 0 ? weekEarnings : undefined,
      bestMomentText:
        weekLikes > 0 ? `Your content received ${weekLikes} likes this week!` : "Keep posting to grow your audience.",
      nextWeekTip: this.getRandomTip(),
      ctaUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
      ...urls,
    }

    const template = weeklyDigestTemplate(digestData)

    await this.supabase.from("email_queue").insert({
      user_id: userId,
      email_type: "weekly_digest",
      template: "weekly_digest" as EmailTemplate,
      subject: template.subject,
      html_content: template.html,
      payload: digestData,
      scheduled_for: new Date().toISOString(),
    })

    return true
  }

  /**
   * Process win-back emails for inactive users
   * Called by behavioral trigger job
   */
  async processWinbackEmails(): Promise<{ queued: number; skipped: number }> {
    let queued = 0
    let skipped = 0

    // Find users who haven't logged in for 7+ days but have followed creators with new posts
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: inactiveUsers, error } = await this.supabase
      .from("profiles")
      .select("id, last_login")
      .lt("last_login", sevenDaysAgo.toISOString())
      .not("last_login", "is", null)
      .limit(100)

    if (error || !inactiveUsers) {
      console.error("[DigestAggregator] Error fetching inactive users:", error)
      return { queued, skipped }
    }

    for (const user of inactiveUsers) {
      // Check if user has behavioral emails enabled
      const { data: prefs } = await this.supabase
        .from("notification_preferences")
        .select("email_behavioral_enabled, unsubscribe_token, paused_until")
        .eq("user_id", user.id)
        .single()

      if (!prefs?.email_behavioral_enabled || prefs.paused_until) {
        skipped++
        continue
      }

      // Check if we already sent a winback email recently (14 days)
      const fourteenDaysAgo = new Date()
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

      const { data: lastWinback } = await this.supabase
        .from("email_send_log")
        .select("sent_at")
        .eq("user_id", user.id)
        .eq("template", "winback")
        .gte("sent_at", fourteenDaysAgo.toISOString())
        .limit(1)

      if (lastWinback && lastWinback.length > 0) {
        skipped++
        continue
      }

      // Get new posts from creators they follow
      const { data: follows } = await this.supabase.from("follows").select("following_id").eq("follower_id", user.id)

      if (!follows || follows.length === 0) {
        skipped++
        continue
      }

      const creatorIds = follows.map((f) => f.following_id)
      const { data: newPosts } = await this.supabase
        .from("posts")
        .select("id, user_id, is_nsfw, profiles:user_id(display_name, handle)")
        .in("user_id", creatorIds)
        .gte("created_at", user.last_login)
        .order("created_at", { ascending: false })
        .limit(5)

      if (!newPosts || newPosts.length === 0) {
        skipped++
        continue
      }

      const urls = generateEmailUrls(prefs.unsubscribe_token)
      const winbackData: WinbackData = {
        missedPosts: newPosts.map((p: any) => ({
          creatorName: p.profiles?.display_name || p.profiles?.handle || "A creator",
          creatorHandle: p.profiles?.handle || "",
          isSensitive: p.is_nsfw || false,
        })),
        ctaUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/feed`,
        ...urls,
      }

      const template = winbackTemplate(winbackData)

      await this.supabase.from("email_queue").insert({
        user_id: user.id,
        email_type: "winback",
        template: "winback" as EmailTemplate,
        subject: template.subject,
        html_content: template.html,
        payload: winbackData,
        scheduled_for: new Date().toISOString(),
      })

      queued++
    }

    return { queued, skipped }
  }

  // Helper methods
  private getHourInTimezone(timezone: string): number {
    try {
      const now = new Date()
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        hour12: false,
      })
      return Number.parseInt(formatter.format(now), 10)
    } catch {
      return new Date().getUTCHours()
    }
  }

  private async generateHighlights(events: any[]): Promise<{ type: string; text: string }[]> {
    const highlights: { type: string; text: string }[] = []

    for (const event of events) {
      if (event.actor_id) {
        const { data: actor } = await this.supabase
          .from("profiles")
          .select("display_name, handle")
          .eq("id", event.actor_id)
          .single()

        const actorName = actor?.display_name || actor?.handle || "Someone"

        switch (event.type) {
          case "like":
            highlights.push({ type: "like", text: `${actorName} liked your post` })
            break
          case "comment":
            highlights.push({ type: "comment", text: `${actorName} commented on your post` })
            break
          case "follow":
            highlights.push({ type: "follow", text: `${actorName} started following you` })
            break
          case "subscribe":
            highlights.push({ type: "subscribe", text: `${actorName} subscribed to your content` })
            break
          case "unlock":
            highlights.push({ type: "unlock", text: `${actorName} unlocked your content` })
            break
        }
      }
    }

    return highlights.slice(0, 5)
  }

  private getRandomTip(): string {
    const tips = [
      "Post consistently to grow your audience faster.",
      "Engage with your fans in comments to build loyalty.",
      "Try posting at different times to find your best hours.",
      "Exclusive content keeps subscribers coming back.",
      "Share behind-the-scenes content to connect with fans.",
    ]
    return tips[Math.floor(Math.random() * tips.length)]
  }
}

// Singleton instance
export const digestAggregator = new DigestAggregator()
