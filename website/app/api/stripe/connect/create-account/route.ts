import { createClient } from "@/lib/supabase/server"
import { getStripeClient } from "@/lib/stripe"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { country, email } = await request.json()

    // Check if user is a creator
    const { data: profile } = await supabase.from("profiles").select("is_creator").eq("id", user.id).single()

    if (!profile?.is_creator) {
      return NextResponse.json({ error: "User is not a creator" }, { status: 403 })
    }

    // Check if account already exists
    const { data: existingSettings } = await supabase
      .from("creator_settings")
      .select("stripe_account_id, stripe_account_status")
      .eq("id", user.id)
      .single()

    if (existingSettings?.stripe_account_id) {
      return NextResponse.json({
        accountId: existingSettings.stripe_account_id,
        status: existingSettings.stripe_account_status,
      })
    }

    const stripe = getStripeClient()

    // Create Stripe Connected Account
    const account = await stripe.accounts.create({
      type: "express",
      country: country || "US",
      email: email,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: {
        creator_id: user.id,
        platform: "telloos",
      },
    })

    // Save account ID to database
    await supabase
      .from("creator_settings")
      .update({
        stripe_account_id: account.id,
        stripe_account_status: "pending_verification",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    // Initialize verification status
    await supabase.from("creator_verification_status").insert({
      creator_id: user.id,
      stripe_account_id: account.id,
      identity_verified: false,
      tax_verified: false,
      payouts_enabled: false,
      charges_enabled: false,
    })

    return NextResponse.json({
      accountId: account.id,
      status: "pending_verification",
    })
  } catch (error) {
    console.error("[v0] Error creating Stripe connected account:", error)
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}
