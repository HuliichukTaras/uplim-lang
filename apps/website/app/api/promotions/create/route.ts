import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getStripeClient } from "@/lib/stripe"

export async function POST(request: Request) {
  try {
    const stripe = getStripeClient()
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { postId, budgetEur, estimatedViews, paymentMethod } = await request.json()

    // Validate budget
    if (!budgetEur || budgetEur < 5) {
      return NextResponse.json({ error: "Minimum budget is €5" }, { status: 400 })
    }

    // Verify post belongs to user and is not 18+
    const { data: post } = await supabase.from("posts").select("*").eq("id", postId).eq("user_id", user.id).single()

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    if (post.is_adult) {
      return NextResponse.json({ error: "Cannot promote 18+ content" }, { status: 400 })
    }

    if (paymentMethod === "wallet") {
      // Get user's wallet
      const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", user.id).single()

      if (!wallet) {
        return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
      }

      // Check if sufficient balance
      if (wallet.available_balance < budgetEur) {
        return NextResponse.json(
          {
            error: "Insufficient balance",
            requiredAmount: budgetEur,
            currentBalance: wallet.available_balance,
          },
          { status: 400 },
        )
      }

      // Create promotion record
      const { data: promotion, error: promotionError } = await supabase
        .from("promotions")
        .insert({
          post_id: postId,
          user_id: user.id,
          budget_eur: budgetEur,
          estimated_views: estimatedViews,
          status: "active",
          views_delivered: 0,
          start_date: new Date().toISOString(),
        })
        .select()
        .single()

      if (promotionError || !promotion) {
        console.error("Promotion creation error:", promotionError)
        return NextResponse.json({ error: "Failed to create promotion" }, { status: 500 })
      }

      // Deduct from wallet using database function
      const { error: transactionError } = await supabase.rpc("record_wallet_transaction", {
        p_wallet_id: wallet.id,
        p_user_id: user.id,
        p_amount: budgetEur,
        p_type: "debit",
        p_category: "promotion",
        p_reference_id: promotion.id,
        p_reference_type: "promotion",
        p_description: `Promotion payment for post ${postId}`,
        p_metadata: {
          post_id: postId,
          promotion_id: promotion.id,
          estimated_views: estimatedViews,
        },
      })

      if (transactionError) {
        console.error("Wallet transaction error:", transactionError)
        // Rollback promotion
        await supabase.from("promotions").delete().eq("id", promotion.id)
        return NextResponse.json({ error: "Failed to process wallet payment" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        promotionId: promotion.id,
        paidFromWallet: true,
      })
    }

    // Create promotion record with pending status
    const { data: promotion, error: promotionError } = await supabase
      .from("promotions")
      .insert({
        post_id: postId,
        user_id: user.id,
        budget_eur: budgetEur,
        estimated_views: estimatedViews,
        status: "pending",
      })
      .select()
      .single()

    if (promotionError || !promotion) {
      console.error("Promotion creation error:", promotionError)
      return NextResponse.json({ error: "Failed to create promotion" }, { status: 500 })
    }

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
      const existingCustomers = await stripe.customers.list({
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

        const customer = await stripe.customers.create(customerData)
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
        await stripe.customers.update(customerId, {
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

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(budgetEur * 100),
      currency: "eur",
      customer: customerId,
      metadata: {
        promotion_id: promotion.id,
        userId: user.id,
        postId: postId,
        type: "promotion",
      },
      description: `Promotion for post ${postId} - ${estimatedViews.toLocaleString()} views`,
      automatic_payment_methods: {
        enabled: true,
      },
      receipt_email: user.email, // Added receipt_email for automatic invoices
    })

    // Update promotion with payment intent ID
    await supabase
      .from("promotions")
      .update({
        stripe_payment_intent_id: paymentIntent.id,
      })
      .eq("id", promotion.id)

    return NextResponse.json({
      success: true,
      promotionId: promotion.id,
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error) {
    console.error("Error creating promotion:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
