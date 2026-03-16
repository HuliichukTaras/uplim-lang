// Notification System Types

export type NotificationEventType =
  | "like"
  | "comment"
  | "follow"
  | "subscribe"
  | "unlock"
  | "tip"
  | "view_milestone"
  | "post_created"
  | "message"

export type NotificationEntityType = "post" | "comment" | "profile" | "subscription" | "message"

export type EmailTemplate = "daily_digest" | "weekly_digest" | "new_subscriber" | "winback" | "product_update" | "promo"

export type EmailQueueStatus = "queued" | "sent" | "failed" | "skipped"

// Database row types
export interface NotificationEvent {
  id: string
  created_at: string
  actor_id: string | null
  recipient_id: string
  type: NotificationEventType
  entity_type: NotificationEntityType
  entity_id: string
  metadata: Record<string, unknown>
  is_sensitive: boolean
  processed_at: string | null
}

export interface Notification {
  id: string
  user_id: string
  actor_id: string | null
  type: string
  group_key: string | null
  entity_type: string | null
  entity_id: string | null
  count: number
  last_actor_id: string | null
  last_event_at: string
  metadata: Record<string, unknown>
  read: boolean
  created_at: string
  updated_at: string
  // Joined fields
  actor?: {
    id: string
    display_name: string | null
    handle: string | null
    avatar_url: string | null
  } | null
  last_actor?: {
    id: string
    display_name: string | null
    handle: string | null
    avatar_url: string | null
  } | null
}

export interface NotificationPreferences {
  id: string
  user_id: string
  // Email toggles (existing)
  email_new_follower: boolean
  email_new_like: boolean
  email_new_comment: boolean
  email_new_message: boolean
  email_new_post_from_following: boolean
  email_purchase_notification: boolean
  email_weekly_digest: boolean
  email_frequency: "instant" | "daily" | "weekly"
  // New fields
  timezone: string
  email_daily_enabled: boolean
  email_weekly_enabled: boolean
  email_product_updates: boolean
  email_promos_enabled: boolean
  email_behavioral_enabled: boolean
  digest_hour_local: number // 0-23
  max_emails_per_week: number
  quiet_hours_start: number // 0-23
  quiet_hours_end: number // 0-23
  unsubscribe_token: string
  paused_until: string | null
  // Timestamps
  last_email_sent_at: string | null
  last_digest_sent_at: string | null
  created_at: string
  updated_at: string
}

export interface EmailQueueItem {
  id: string
  user_id: string
  email_type: string
  template: EmailTemplate
  subject: string
  html_content: string
  payload: Record<string, unknown>
  metadata: Record<string, unknown>
  status: EmailQueueStatus
  attempts: number
  last_error: string | null
  error_message: string | null
  scheduled_for: string
  sent_at: string | null
  created_at: string
}

export interface EmailSendLog {
  id: string
  user_id: string
  template: EmailTemplate
  sent_at: string
  provider_message_id: string | null
  open_tracked: boolean
  click_tracked: boolean
  metadata: Record<string, unknown>
}

// Digest payload types
export interface DailyDigestPayload {
  total_updates: number
  likes_count: number
  comments_count: number
  followers_count: number
  subscribers_count: number
  unlocks_count: number
  tips_total: number
  highlights: DigestHighlight[]
  cta_url: string
  settings_url: string
  unsubscribe_url: string
}

export interface WeeklyDigestPayload {
  week_summary_title: string
  weekly_intro: string
  week_likes: number
  week_comments: number
  week_new_followers: number
  week_new_subs: number
  week_earnings: number
  best_moment_text: string
  next_week_tip: string
  cta_url: string
  settings_url: string
  unsubscribe_url: string
}

export interface DigestHighlight {
  type: "new_post" | "trending_post" | "new_follower" | "milestone"
  text: string
  link?: string
}

export interface WinbackPayload {
  missed_posts: {
    creator_name: string
    creator_handle: string
    post_id: string
    is_sensitive: boolean
  }[]
  cta_url: string
  settings_url: string
  unsubscribe_url: string
}

// Input types for creating events
export interface CreateNotificationEventInput {
  actorId: string | null
  recipientId: string
  type: NotificationEventType
  entityType: NotificationEntityType
  entityId: string
  metadata?: Record<string, unknown>
  isSensitive?: boolean
}
