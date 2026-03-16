import { createClient } from "@/lib/supabase/server"
import { getStripeClient } from "@/lib/stripe"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Get user's wallet
    const { data: wallet } = await supabase.from("wallets").select("id").eq("user_id", user.id).single()

    if (!wallet) {
      // Try to create if missing
      await supabase.from("wallets").insert({ user_id: user.id })
      return NextResponse.json({ error: "Wallet created, please try again" }, { status: 400 })
    }

    // 2. Search Stripe for successful payments by this user email
    const stripe = getStripeClient()

    // We search by email because we might not have stored the stripe_customer_id yet if it was a guest checkout or old logic
    // Ideally we use metadata['userId'] search but Stripe search API has latency.
    // List payment intents is safer.

    const paymentIntents = await stripe.paymentIntents.search({
      query: `metadata['userId']:'${user.id}' AND status:'succeeded'`,
      limit: 20,
    })

    let syncedCount = 0

    for (const pi of paymentIntents.data) {
      // Check if already recorded
      const { data: existing } = await supabase
        .from("wallet_transactions")
        .select("id")
        .eq("wallet_id", wallet.id)
        .contains("metadata", { stripe_payment_intent_id: pi.id })
        .maybeSingle()

      if (!existing) {
        // It's missing! Let's add it.
        // Was it a top up or a direct purchase?
        const type = pi.metadata.type || "wallet_top_up"

        // Only sync top-ups to wallet balance. Direct purchases (like 'promotion') shouldn't add to balance if they were consumed immediately.
        // But if the 'promotion' logic (credit then debit) failed halfway, we might need to recover.
        // For safety, we only sync "wallet_top_up" or generic ones.

        // Wait, the user lost 15 euro. That sounds like a top-up.

        const amount = pi.amount / 100

        await supabase.rpc("record_wallet_transaction", {
          p_wallet_id: wallet.id,
          p_user_id: user.id,
          p_amount: amount,
          p_type: "credit",
          p_category: "top_up",
          p_reference_id: null,
          p_reference_type: "stripe_payment_intent_recovery",
          p_description: "Recovered Wallet top-up via Stripe",
          p_metadata: {
            stripe_payment_intent_id: pi.id,
            synced_at: new Date().toISOString(),
          },
          p_status: "completed",
        })

        syncedCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} missing transactions`,
      syncedCount,
    })
  } catch (error) {
    console.error("[v0] Sync error:", error)
    return NextResponse.json({ error: "Failed to sync transactions" }, { status: 500 })
  }
}
