import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  )

  try {
    // Отримуємо всі pending emails
    const { data: emails, error: fetchError } = await supabase
      .from("email_queue")
      .select("id, user_id, subject, html_content")
      .eq("email_type", "broadcast")
      .eq("status", "pending")
      .limit(170)

    if (fetchError) throw fetchError
    if (!emails || emails.length === 0) {
      return NextResponse.json({ message: "No pending emails", sent: 0 })
    }

    let sent = 0
    let failed = 0

    for (const email of emails) {
      try {
        // Отримуємо email адресу користувача
        const { data: user, error: userError } = await supabase
          .from("auth.users")
          .select("email")
          .eq("id", email.user_id)
          .single()

        if (userError || !user) continue

        // Відправляємо через Resend
        const result = await resend.emails.send({
          from: "support@fantikx.com",
          to: user.email,
          subject: "New Content on Fantikx!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px;">
              <h1 style="margin: 0 0 20px 0;">Hello!</h1>
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">We've got fresh new content from amazing creators on Fantikx!</p>
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Join us and discover the latest and greatest content.</p>
              <a href="https://fantikx.com/discover" style="display: inline-block; background-color: white; color: #667eea; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0;">Explore Content</a>
              <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.3); margin: 30px 0;">
              <p style="font-size: 12px; color: rgba(255, 255, 255, 0.8); margin: 0;">Fantikx - Your content platform</p>
            </div>
          `,
        })

        if (result.error) {
          // Оновлюємо статус на failed
          await supabase
            .from("email_queue")
            .update({
              status: "failed",
              error_message: result.error.message,
              attempts: 1,
            })
            .eq("id", email.id)
          failed++
        } else {
          // Оновлюємо статус на sent
          await supabase
            .from("email_queue")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
              attempts: 1,
            })
            .eq("id", email.id)
          sent++
        }
      } catch (error) {
        failed++
        console.error(`[v0] Error sending email ${email.id}:`, error)
      }
    }

    return NextResponse.json({
      message: "Broadcast sent",
      total: emails.length,
      sent,
      failed,
    })
  } catch (error) {
    console.error("[v0] Broadcast error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
