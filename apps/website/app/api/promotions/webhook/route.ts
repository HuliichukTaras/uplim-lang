import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getStripeClient } from "@/lib/stripe"
import Stripe from "stripe"

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    const stripe = getStripeClient()
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    const promotionId = session.metadata?.promotion_id

    if (promotionId) {
      const supabase = await createClient()

      // Activate the promotion
      await supabase
        .from("promotions")
        .update({
          status: "active",
          start_date: new Date().toISOString(),
        })
        .eq("id", promotionId)
    }
  }

  return NextResponse.json({ received: true })
}
