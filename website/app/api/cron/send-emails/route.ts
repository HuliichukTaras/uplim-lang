import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { emailSender } from "@/lib/email/email-sender"
import type { EmailTemplate } from "@/lib/notifications/types"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * Email sender cron job - runs every 5-10 minutes
 * Processes queued emails and sends them via Resend
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceClient()
  const results = { sent: 0, failed: 0, skipped: 0, errors: [] as string[] }

  try {
    // Get pending emails scheduled for now or earlier
    const { data: emails, error } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .lt("attempts", 3) // Max 3 attempts
      .order("scheduled_for", { ascending: true })
      .limit(50) // Process 50 at a time

    if (error) {
      console.error("[Cron] Error fetching email queue:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!emails || emails.length === 0) {
      return NextResponse.json({ message: "No emails to send", ...results })
    }

    console.log(`[Cron] Processing ${emails.length} emails...`)

    for (const emailItem of emails) {
      try {
        // Get user email
        const userEmail = await emailSender.getUserEmail(emailItem.user_id)

        if (!userEmail) {
          await supabase
            .from("email_queue")
            .update({
              status: "failed",
              error_message: "No email found for user",
              attempts: emailItem.attempts + 1,
            })
            .eq("id", emailItem.id)
          results.failed++
          continue
        }

        // Send email
        const result = await emailSender.send({
          to: userEmail,
          subject: emailItem.subject,
          html: emailItem.html_content,
          userId: emailItem.user_id,
          template: (emailItem.template || emailItem.email_type) as EmailTemplate,
          metadata: emailItem.metadata || {},
        })

        if (result.success) {
          await supabase
            .from("email_queue")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
            })
            .eq("id", emailItem.id)
          results.sent++
        } else {
          const newAttempts = emailItem.attempts + 1
          await supabase
            .from("email_queue")
            .update({
              status: newAttempts >= 3 ? "failed" : "pending",
              last_error: result.error,
              error_message: result.error,
              attempts: newAttempts,
            })
            .eq("id", emailItem.id)

          if (result.error?.includes("rate limit") || result.error?.includes("quiet hours")) {
            results.skipped++
          } else {
            results.failed++
            results.errors.push(result.error || "Unknown error")
          }
        }
      } catch (err) {
        console.error("[Cron] Error processing email:", err)
        await supabase
          .from("email_queue")
          .update({
            status: "failed",
            error_message: String(err),
            attempts: emailItem.attempts + 1,
          })
          .eq("id", emailItem.id)
        results.failed++
        results.errors.push(String(err))
      }
    }

    console.log(
      `[Cron] Email queue processed: ${results.sent} sent, ${results.failed} failed, ${results.skipped} skipped`,
    )

    return NextResponse.json({ message: "Email queue processed", ...results })
  } catch (error) {
    console.error("[Cron] Send-emails error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
