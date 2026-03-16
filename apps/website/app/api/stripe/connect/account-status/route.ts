import { createClient } from "@/lib/supabase/server"
import { getStripeClient } from "@/lib/stripe"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get creator settings
    const { data: settings } = await supabase
      .from("creator_settings")
      .select("stripe_account_id")
      .eq("id", user.id)
      .single()

    if (!settings?.stripe_account_id) {
      return NextResponse.json({ error: "No Stripe account found" }, { status: 404 })
    }

    const stripe = getStripeClient()

    // Retrieve account from Stripe
    const account = await stripe.accounts.retrieve(settings.stripe_account_id)

    // Sync status to database
    await supabase.rpc("sync_stripe_account_status", {
      p_creator_id: user.id,
      p_stripe_account_id: account.id,
      p_payouts_enabled: account.payouts_enabled || false,
      p_charges_enabled: account.charges_enabled || false,
      p_requirements: account.requirements || {},
      p_disabled_reason: account.requirements?.disabled_reason || null,
    })

    // Get updated verification status
    const { data: verificationStatus } = await supabase
      .from("creator_verification_status")
      .select("*")
      .eq("creator_id", user.id)
      .single()

    return NextResponse.json({
      account: {
        id: account.id,
        payouts_enabled: account.payouts_enabled,
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
      },
      requirements: account.requirements,
      verification: verificationStatus,
    })
  } catch (error) {
    console.error("[v0] Error fetching account status:", error)
    return NextResponse.json({ error: "Failed to fetch account status" }, { status: 500 })
  }
}
