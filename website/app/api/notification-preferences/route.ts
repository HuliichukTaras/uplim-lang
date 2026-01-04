import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase.from("notification_preferences").select("*").eq("user_id", user.id).single()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Error fetching notification preferences:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({
        // Existing fields
        email_new_follower: true,
        email_new_like: true,
        email_new_comment: true,
        email_new_message: true,
        email_new_post_from_following: true,
        email_purchase_notification: true,
        email_weekly_digest: true,
        email_frequency: "instant",
        push_enabled: false,
        push_new_follower: true,
        push_new_like: true,
        push_new_comment: true,
        push_new_message: true,
        // New fields
        timezone: "Europe/Kyiv",
        email_daily_enabled: true,
        email_weekly_enabled: true,
        email_product_updates: true,
        email_promos_enabled: false,
        email_behavioral_enabled: true,
        digest_hour_local: 19,
        max_emails_per_week: 4,
        quiet_hours_start: 22,
        quiet_hours_end: 9,
        paused_until: null,
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in GET /api/notification-preferences:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const preferences = await request.json()

    const allowedFields = [
      // Existing fields
      "email_new_follower",
      "email_new_like",
      "email_new_comment",
      "email_new_message",
      "email_new_post_from_following",
      "email_purchase_notification",
      "email_weekly_digest",
      "email_frequency",
      "push_enabled",
      "push_new_follower",
      "push_new_like",
      "push_new_comment",
      "push_new_message",
      // New fields
      "timezone",
      "email_daily_enabled",
      "email_weekly_enabled",
      "email_product_updates",
      "email_promos_enabled",
      "email_behavioral_enabled",
      "digest_hour_local",
      "max_emails_per_week",
      "quiet_hours_start",
      "quiet_hours_end",
      "paused_until",
    ]

    const sanitizedPrefs: Record<string, unknown> = { user_id: user.id }
    for (const field of allowedFields) {
      if (field in preferences) {
        sanitizedPrefs[field] = preferences[field]
      }
    }

    // Validate numeric fields
    if (sanitizedPrefs.digest_hour_local !== undefined) {
      const hour = Number(sanitizedPrefs.digest_hour_local)
      if (isNaN(hour) || hour < 0 || hour > 23) {
        return NextResponse.json({ error: "digest_hour_local must be 0-23" }, { status: 400 })
      }
      sanitizedPrefs.digest_hour_local = hour
    }

    if (sanitizedPrefs.max_emails_per_week !== undefined) {
      const max = Number(sanitizedPrefs.max_emails_per_week)
      if (isNaN(max) || max < 0 || max > 20) {
        return NextResponse.json({ error: "max_emails_per_week must be 0-20" }, { status: 400 })
      }
      sanitizedPrefs.max_emails_per_week = max
    }

    const serviceClient = createServiceClient()

    // Generate unsubscribe token if not exists
    const { data: existing } = await serviceClient
      .from("notification_preferences")
      .select("unsubscribe_token")
      .eq("user_id", user.id)
      .single()

    if (!existing?.unsubscribe_token) {
      sanitizedPrefs.unsubscribe_token = crypto.randomUUID() + crypto.randomUUID()
    }

    const { data, error } = await serviceClient
      .from("notification_preferences")
      .upsert(sanitizedPrefs, { onConflict: "user_id" })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving notification preferences:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, preferences: data })
  } catch (error) {
    console.error("[v0] Error in POST /api/notification-preferences:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
