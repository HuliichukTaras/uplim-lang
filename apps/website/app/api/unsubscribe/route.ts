import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Find user by unsubscribe token
    const { data: prefs, error: findError } = await supabase
      .from("notification_preferences")
      .select("user_id")
      .eq("unsubscribe_token", token)
      .single()

    if (findError || !prefs) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 })
    }

    // Disable all email notifications
    const { error: updateError } = await supabase
      .from("notification_preferences")
      .update({
        email_daily_enabled: false,
        email_weekly_enabled: false,
        email_behavioral_enabled: false,
        email_product_updates: false,
        email_promos_enabled: false,
        email_new_follower: false,
        email_new_like: false,
        email_new_comment: false,
        email_new_message: false,
        email_new_post_from_following: false,
        email_purchase_notification: false,
        email_weekly_digest: false,
      })
      .eq("user_id", prefs.user_id)

    if (updateError) {
      console.error("[v0] Error unsubscribing:", updateError)
      return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 })
    }

    // Redirect to a confirmation page
    return NextResponse.redirect(new URL("/unsubscribed", request.url))
  } catch (error) {
    console.error("[v0] Unexpected error in GET /api/unsubscribe:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { token, preferences } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Find user by unsubscribe token
    const { data: prefs, error: findError } = await supabase
      .from("notification_preferences")
      .select("user_id")
      .eq("unsubscribe_token", token)
      .single()

    if (findError || !prefs) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 })
    }

    // Update specific preferences if provided
    const allowedUpdates = [
      "email_daily_enabled",
      "email_weekly_enabled",
      "email_behavioral_enabled",
      "email_product_updates",
      "email_promos_enabled",
    ]

    const updates: Record<string, boolean> = {}
    for (const field of allowedUpdates) {
      if (field in preferences) {
        updates[field] = Boolean(preferences[field])
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid preferences to update" }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from("notification_preferences")
      .update(updates)
      .eq("user_id", prefs.user_id)

    if (updateError) {
      console.error("[v0] Error updating preferences:", updateError)
      return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Unexpected error in POST /api/unsubscribe:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
