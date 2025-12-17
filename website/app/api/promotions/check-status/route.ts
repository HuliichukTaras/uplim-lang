import { createClient } from "@/lib/supabase/server"
import { getStripeClient } from "@/lib/stripe"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { promotionId } = await request.json()
  const supabase = await createClient()
  const stripe = getStripeClient()

  // Get promotion details
  const { data: promotion } = await supabase.from("promotions").select("*").eq("id", promotionId).single()

  if (!promotion) {
    return NextResponse.json({ error: "Promotion not found" }, { status: 404 })
  }

  // If already active, return success
  if (promotion.status === "active") {
    return NextResponse.json({ status: "active" })
  }

  // Check Stripe PaymentIntent status if available
  // We look for a recent wallet transaction or check Stripe directly if we stored the PI ID
  // Since we don't store PI ID on promotion directly, we check wallet transactions

  const { data: transaction } = await supabase
    .from("wallet_transactions")
    .select("metadata")
    .eq("reference_id", promotionId)
    .eq("category", "promotion")
    .single()

  if (transaction) {
    // Payment was recorded in wallet, so promotion should be active
    if (promotion.status !== "active") {
      await supabase
        .from("promotions")
        .update({ status: "active", started_at: new Date().toISOString() })
        .eq("id", promotionId)

      return NextResponse.json({ status: "active" })
    }
  }

  return NextResponse.json({ status: promotion.status })
}
