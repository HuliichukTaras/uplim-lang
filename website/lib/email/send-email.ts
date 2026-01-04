import { createServiceClient } from "@/lib/supabase/server"

interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || "Fantikx <noreply@fantikx.com>"

export async function sendEmail(
  options: EmailOptions,
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const { to, subject, html, from = DEFAULT_FROM } = options

  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    console.error("[Fantikx] RESEND_API_KEY not configured")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
      }),
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error("[Fantikx] Resend API error:", responseData)
      return { success: false, error: JSON.stringify(responseData) }
    }

    return { success: true, messageId: responseData.id }
  } catch (error) {
    console.error("[Fantikx] Error sending email:", error)
    return { success: false, error: String(error) }
  }
}

export async function queueEmail(
  userId: string,
  emailType: string,
  subject: string,
  htmlContent: string,
  metadata: Record<string, unknown> = {},
  scheduledFor?: Date,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient()

    const { error } = await supabase.from("email_queue").insert({
      user_id: userId,
      email_type: emailType,
      subject,
      html_content: htmlContent,
      metadata,
      scheduled_for: scheduledFor?.toISOString() || new Date().toISOString(),
    })

    if (error) {
      console.error("[Fantikx] Error queueing email:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("[Fantikx] Error queueing email:", error)
    return { success: false, error: String(error) }
  }
}
