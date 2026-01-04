import { createClient } from "@/lib/supabase/server"
import { getStripeClient } from "@/lib/stripe"
import { NextResponse } from "next/server"
import { calculateTopUpTotal, WALLET_PACKAGES } from "@/lib/wallet"

export async function POST(request: Request) {
  try {
    console.log("[v0] Top-up intent request received")
    console.log("[v0] Checking Stripe configuration...")
    console.log("[v0] STRIPE_SECRET_KEY exists:", !!process.env.STRIPE_SECRET_KEY)
    console.log("[v0] STRIPE_SECRET_KEY length:", process.env.STRIPE_SECRET_KEY?.length || 0)

    let stripeClient: ReturnType<typeof getStripeClient>
    try {
      stripeClient = getStripeClient()
      console.log("[v0] Stripe client initialized successfully")
    } catch (configError) {
      console.error("[v0] Stripe configuration error:", configError)
      return NextResponse.json(
        { error: "Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables." },
        { status: 500 },
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount } = await request.json()

    // Validate package amount
    if (!WALLET_PACKAGES.includes(amount)) {
      return NextResponse.json({ error: "Invalid package amount" }, { status: 400 })
    }

    const { total, coins, fee } = calculateTopUpTotal(amount)

    // Amount in cents for Stripe
    const amountInCents = Math.round(total * 100)

    const processingFee = fee
    const totalAmount = total

    // Get user profile for display name
    const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single()

    // Get billing profile
    const { data: billingProfile } = await supabase
      .from("billing_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    let customerId = billingProfile?.stripe_customer_id

    // Create or retrieve Stripe Customer
    if (!customerId) {
      // Check if we can find a customer by email first to avoid duplicates
      const existingCustomers = await stripeClient.customers.list({
        email: user.email,
        limit: 1,
      })

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id
      } else {
        // Create new customer
        const customerData: any = {
          email: user.email,
          name: profile?.display_name || "Fantikx User",
          metadata: {
            userId: user.id,
          },
        }

        // Add address if available
        if (billingProfile?.country) {
          customerData.address = {
            line1: billingProfile.address_line1,
            line2: billingProfile.address_line2,
            city: billingProfile.city,
            state: billingProfile.state,
            postal_code: billingProfile.postal_code,
            country: billingProfile.country,
          }
        }

        const customer = await stripeClient.customers.create(customerData)
        customerId = customer.id
      }

      // Save customer ID to billing_profiles
      await supabase.from("billing_profiles").upsert(
        {
          user_id: user.id,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
          country: billingProfile?.country || "US",
        },
        { onConflict: "user_id" },
      )
    } else {
      // Update customer address if billing profile has changed
      if (billingProfile?.country) {
        await stripeClient.customers.update(customerId, {
          address: {
            line1: billingProfile.address_line1,
            line2: billingProfile.address_line2,
            city: billingProfile.city,
            state: billingProfile.state,
            postal_code: billingProfile.postal_code,
            country: billingProfile.country,
          },
        })
      }
    }

    console.log("[v0] Creating payment intent for customer:", customerId, "amount:", totalAmount)

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: amountInCents,
      currency: "eur", // Changed from usd to eur per requirements
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      // Note: For automatic tax calculation, use Stripe Tax with Checkout Sessions or Invoices
      metadata: {
        userId: user.id,
        type: "wallet_top_up",
        packageAmount: amount.toString(),
        feeAmount: fee.toString(),
        coinsAmount: coins.toString(),
      },
      description: `Wallet top-up: €${amount} (${coins} Coins) + €${fee.toFixed(2)} fee`,
      receipt_email: user.email,
    })

    console.log("[v0] Payment intent created successfully:", paymentIntent.id)
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      details: {
        package: amount,
        fee: fee,
        total: total,
        coins: coins,
      },
    })
  } catch (error) {
    console.error("[v0] Top-up intent creation error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create payment intent",
      },
      { status: 500 },
    )
  }
}
