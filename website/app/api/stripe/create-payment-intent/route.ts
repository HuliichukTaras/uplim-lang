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

    const { postId } = await request.json()

    // Fetch post details
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("*, profiles:user_id(display_name)")
      .eq("id", postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    if (!post.is_paid) {
      return NextResponse.json({ error: "Post is not paid content" }, { status: 400 })
    }

    // Check if already unlocked
    const { data: existingUnlock } = await supabase
      .from("post_unlocks")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (existingUnlock) {
      return NextResponse.json({ error: "Post already unlocked" }, { status: 400 })
    }

    // Create payment intent
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(post.price * 100), // Convert to cents
      currency: "usd",
      metadata: {
        postId,
        userId: user.id,
        creatorId: post.user_id,
      },
      description: `Unlock post by ${post.profiles.display_name || "Creator"}`,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error) {
    console.error("[v0] Payment intent creation error:", error)
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 })
  }
}
