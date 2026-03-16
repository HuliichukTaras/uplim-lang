import { createClient } from "@/lib/supabase/server"
import { getStripeClient } from "@/lib/stripe"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    let stripeClient: ReturnType<typeof getStripeClient>
    try {
      stripeClient = getStripeClient()
    } catch (configError) {
      console.error("[v0] Stripe configuration error:", configError)
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 })
    }
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { creatorId } = await request.json()

    // Fetch creator settings
    const { data: creatorSettings, error: settingsError } = await supabase
      .from("creator_settings")
      .select("*, profiles:id(display_name)")
      .eq("id", creatorId)
      .single()

    if (settingsError || !creatorSettings || !creatorSettings.subscription_enabled) {
      return NextResponse.json({ error: "Creator subscriptions not available" }, { status: 400 })
    }

    // Check if already subscribed
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("subscriber_id", user.id)
      .eq("creator_id", creatorId)
      .eq("status", "active")
      .single()

    if (existingSub) {
      return NextResponse.json({ error: "Already subscribed to this creator" }, { status: 400 })
    }

    // Create Stripe checkout session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

    if (!baseUrl) {
      console.error("[v0] Missing NEXT_PUBLIC_BASE_URL environment variable")
      return NextResponse.json({ error: "Application URL not configured" }, { status: 500 })
    }

    const session = await stripeClient.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Subscription to ${creatorSettings.profiles.display_name || "Creator"}`,
              description: "Monthly subscription for exclusive content",
            },
            unit_amount: Math.round(creatorSettings.subscription_price * 100),
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        subscriberId: user.id,
        creatorId,
      },
      success_url: `${baseUrl}/feed?subscription=success`,
      cancel_url: `${baseUrl}/feed?subscription=canceled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("[v0] Subscription creation error:", error)
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
  }
}
