import { createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getStripeClient } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { livestream_id, amount, message } = body

    if (!livestream_id || !amount || amount < 1) {
      return NextResponse.json(
        { error: "Invalid donation amount" },
        { status: 400 }
      )
    }

    // Get livestream and creator
    const { data: livestream, error: streamError } = await supabase
      .from("livestreams")
      .select("id, creator_id, title")
      .eq("id", livestream_id)
      .eq("is_live", true)
      .single()

    if (streamError || !livestream) {
      return NextResponse.json(
        { error: "Livestream not found or not active" },
        { status: 404 }
      )
    }

    // Check if user is subscribed to creator (has follow)
    const { data: follow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", livestream.creator_id)
      .single()

    if (!follow) {
      return NextResponse.json(
        { error: "You must be subscribed to donate" },
        { status: 403 }
      )
    }

    const stripe = getStripeClient()

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      metadata: {
        livestream_id,
        donor_id: user.id,
        message: message || "",
      },
    })

    // Save donation to database
    const { data: donation, error: donationError } = await supabase
      .from("livestream_donations")
      .insert({
        livestream_id,
        donor_id: user.id,
        amount,
        message,
        stripe_payment_intent_id: paymentIntent.id,
      })
      .select()
      .single()

    if (donationError) {
      console.error("[v0] Error saving donation:", donationError)
      return NextResponse.json(
        { error: "Failed to save donation" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      donation,
    })
  } catch (error) {
    console.error("[v0] Donation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
