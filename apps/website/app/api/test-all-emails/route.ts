import { NextResponse } from "next/server"
import { notificationService } from "@/lib/email/notification-service"
import { createServiceClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

/**
 * Test endpoint to send all email types to a specific user
 * Usage: GET /api/test-all-emails?email=test@example.com
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const testEmail = searchParams.get("email") || "tarashuliichuk@gmail.com"

  const supabase = createServiceClient()

  // Get test user ID
  const { data: users } = await supabase.from("auth.users").select("id").eq("email", testEmail).single()

  if (!users) {
    return NextResponse.json({ error: "Test user not found" }, { status: 404 })
  }

  const testUserId = users.id
  const results = []

  try {
    // 1. Welcome Email
    await notificationService.sendWelcomeEmail(testUserId)
    results.push("✅ Welcome email sent")

    // 2. New Follower
    await notificationService.notifyNewFollower(testUserId, "mock-follower-id")
    results.push("✅ New follower email sent")

    // 3. New Like
    await notificationService.notifyNewLike(testUserId, "mock-liker-id", "mock-post-id")
    results.push("✅ New like email sent")

    // 4. New Comment
    await notificationService.notifyNewComment(
      testUserId,
      "mock-commenter-id",
      "This is a test comment!",
      "mock-post-id",
    )
    results.push("✅ New comment email sent")

    // 5. New Message
    await notificationService.notifyNewMessage(testUserId, "mock-sender-id", "Hey! This is a test message")
    results.push("✅ New message email sent")

    // 6. Purchase Notification
    await notificationService.notifyPurchase(testUserId, "mock-buyer-id", "9.99", "mock-post-id")
    results.push("✅ Purchase notification email sent")

    // 7. Broadcast (from templates directly)
    const { emailTemplates } = await import("@/lib/email/templates")
    const { sendEmail } = await import("@/lib/email/send-email")

    const broadcastTemplate = {
      subject: "Exciting news from Fantikx!",
      html: emailTemplates.wrapper(
        `
        <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 24px; font-weight: 700;">Check out what's new!</h2>
        <p style="margin: 0 0 28px 0; color: #6b7280; font-size: 15px;">We've got fresh content waiting for you.</p>
        ${emailTemplates.button("Explore Now", "https://fantikx.com/discover")}
      `,
        "there",
      ),
    }

    await sendEmail({ to: testEmail, ...broadcastTemplate })
    results.push("✅ Broadcast email sent")

    return NextResponse.json({
      message: `All 7 email types sent to ${testEmail}`,
      results,
      note: "Check your inbox (and spam folder) in a few moments!",
    })
  } catch (error) {
    console.error("[Test] Error sending emails:", error)
    return NextResponse.json({ error: String(error), results }, { status: 500 })
  }
}
