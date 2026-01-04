import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getStripeClient } from "@/lib/stripe"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount, method, payoutDetails } = await request.json()

    // Validate amount
    if (!amount || amount < 10) {
      return NextResponse.json({ error: "Minimum withdrawal amount is $10.00" }, { status: 400 })
    }

    const platformFee = Number((amount * 0.15).toFixed(2)) // 15% Platform Fee
    const estimatedStripeFee = 0.25 // Fixed Stripe Payout Fee

    const netAmount = Number((amount - platformFee - estimatedStripeFee).toFixed(2))

    if (netAmount <= 0) {
      return NextResponse.json({ error: "Withdrawal amount too low to cover fees" }, { status: 400 })
    }

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (walletError || !wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
    }

    // Check sufficient balance
    if (wallet.available_balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    let stripeTransferId = null
    let status = "pending"

    // Handle Stripe Connect Payouts
    if (method === "stripe_connect") {
      const stripe = getStripeClient()

      // Get creator verification status to find Stripe Account ID
      const { data: verification } = await supabase
        .from("creator_verification_status")
        .select("stripe_account_id, payouts_enabled")
        .eq("creator_id", user.id)
        .single()

      if (!verification?.stripe_account_id || !verification?.payouts_enabled) {
        return NextResponse.json({ error: "Stripe account not connected or payouts disabled" }, { status: 400 })
      }

      try {
        // Create a Transfer to the connected account
        const transfer = await stripe.transfers.create({
          amount: Math.round(netAmount * 100),
          currency: "usd",
          destination: verification.stripe_account_id,
          description: `Payout for ${user.email} (Net: $${netAmount}, Fee: $${platformFee})`,
        })

        stripeTransferId = transfer.id
        status = "completed" // Instant transfer
      } catch (stripeError: any) {
        console.error("Stripe transfer error:", stripeError)
        return NextResponse.json({ error: stripeError.message || "Failed to process Stripe transfer" }, { status: 500 })
      }
    }

    // Create payout request record
    const { data: payoutRequest, error: payoutError } = await supabase
      .from("payout_requests")
      .insert({
        user_id: user.id,
        wallet_id: wallet.id,
        amount,
        payout_method: method,
        payout_details: payoutDetails,
        status: status,
        stripe_payout_id: stripeTransferId,
        processed_at: status === "completed" ? new Date().toISOString() : null,
        platform_fee: platformFee,
        stripe_fee: estimatedStripeFee,
        net_amount: netAmount,
      })
      .select()
      .single()

    if (payoutError) {
      console.error("[v0] Payout request creation error:", payoutError)
      return NextResponse.json({ error: "Failed to create payout request" }, { status: 500 })
    }

    // Deduct from wallet (Full Amount)
    const { error: transactionError } = await supabase.rpc("record_wallet_transaction", {
      p_wallet_id: wallet.id,
      p_user_id: user.id,
      p_amount: amount,
      p_type: "debit",
      p_category: "withdrawal",
      p_reference_id: payoutRequest.id,
      p_reference_type: "payout_request",
      p_description: `Withdrawal via ${method}`,
      p_metadata: {
        stripe_transfer_id: stripeTransferId,
        platform_fee: platformFee,
        stripe_fee: estimatedStripeFee,
        net_received: netAmount,
      },
    })

    await supabase.from("transactions").insert({
      user_id: user.id,
      creator_id: user.id, // Self
      type: "withdrawal",
      status: status,
      price_original: amount,
      user_paid: 0,
      processing_fee_user: 0,
      stripe_fee: estimatedStripeFee,
      creator_earnings: netAmount,
      platform_profit: platformFee, // This is where we earn the 15%
      currency: "usd",
      stripe_transfer_id: stripeTransferId,
    })

    // Update Platform Finance Stats
    await supabase.rpc("update_platform_finance", {
      p_processing_fee: 0,
      p_stripe_cost: estimatedStripeFee,
      p_withdrawal_fee: platformFee,
    })

    if (transactionError) {
      console.error("[v0] Wallet transaction error:", transactionError)
      return NextResponse.json({ error: "Failed to update wallet" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      payoutRequest,
      message:
        status === "completed" ? "Withdrawal processed successfully" : "Withdrawal request submitted successfully",
    })
  } catch (error) {
    console.error("[v0] Withdrawal request error:", error)
    return NextResponse.json({ error: "Failed to process withdrawal request" }, { status: 500 })
  }
}
