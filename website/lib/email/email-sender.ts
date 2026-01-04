import { createServiceClient } from "@/lib/supabase/server"
import type { EmailTemplate } from "@/lib/notifications/types"

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  userId: string
  template: EmailTemplate
  metadata?: Record<string, unknown>
}

interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * EmailSender - Handles sending emails via Resend with logging
 */
export class EmailSender {
  private resendApiKey: string | undefined
  private supabase = createServiceClient()

  constructor() {
    this.resendApiKey = process.env.RESEND_API_KEY
  }

  /**
   * Check if user can receive emails (rate limits, quiet hours, paused)
   */
  async canSendEmail(userId: string): Promise<{ canSend: boolean; reason?: string }> {
    // Get user preferences
    const { data: prefs } = await this.supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (!prefs) {
      return { canSend: true } // No preferences = allow
    }

    // Check if paused
    if (prefs.paused_until && new Date(prefs.paused_until) > new Date()) {
      return { canSend: false, reason: "Emails paused by user" }
    }

    // Check quiet hours using DB function
    const { data: inQuietHours } = await this.supabase.rpc("is_user_in_quiet_hours", { p_user_id: userId })

    if (inQuietHours) {
      return { canSend: false, reason: "User in quiet hours" }
    }

    // Check weekly rate limit
    const { data: emailsThisWeek } = await this.supabase.rpc("get_emails_sent_this_week", { p_user_id: userId })

    if (emailsThisWeek >= (prefs.max_emails_per_week || 4)) {
      return { canSend: false, reason: "Weekly email limit reached" }
    }

    return { canSend: true }
  }

  /**
   * Send an email via Resend and log it
   */
  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const { to, subject, html, userId, template, metadata } = options

    // Check rate limits
    const { canSend, reason } = await this.canSendEmail(userId)
    if (!canSend) {
      console.log(`[EmailSender] Skipping email to ${userId}: ${reason}`)
      return { success: false, error: reason }
    }

    if (!this.resendApiKey) {
      console.log(`[EmailSender] No RESEND_API_KEY, would send to: ${to}, subject: ${subject}`)
      // Log as sent for development
      await this.logSentEmail(userId, template, null, metadata)
      return { success: true }
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Fantikx <noreply@fantikx.com>",
          to,
          subject,
          html,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[EmailSender] Resend API error:", errorText)
        return { success: false, error: errorText }
      }

      const data = await response.json()
      const messageId = data.id

      // Log successful send
      await this.logSentEmail(userId, template, messageId, metadata)

      return { success: true, messageId }
    } catch (error) {
      console.error("[EmailSender] Exception sending email:", error)
      return { success: false, error: String(error) }
    }
  }

  /**
   * Log sent email to email_send_log for analytics and rate limiting
   */
  private async logSentEmail(
    userId: string,
    template: EmailTemplate,
    messageId: string | null,
    metadata?: Record<string, unknown>,
  ) {
    try {
      await this.supabase.from("email_send_log").insert({
        user_id: userId,
        template,
        sent_at: new Date().toISOString(),
        provider_message_id: messageId,
        metadata: metadata || {},
      })
    } catch (error) {
      console.error("[EmailSender] Failed to log email:", error)
    }
  }

  /**
   * Get user's email address from auth
   */
  async getUserEmail(userId: string): Promise<string | null> {
    const { data } = await this.supabase.auth.admin.getUserById(userId)
    return data?.user?.email || null
  }
}

// Singleton instance
export const emailSender = new EmailSender()
