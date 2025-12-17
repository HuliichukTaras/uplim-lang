import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { coinsToEur, AUTHOR_SHARE_PERCENT, PLATFORM_SHARE_PERCENT, eurToCoins } from "@/lib/wallet"

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

    const { postId, creatorId, amount: coinsAmount, unlockType } = await request.json()

    if (!postId || !creatorId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (unlockType === "quest") {
      // Verify quest completion (like + share)
      const { data: like } = await supabase
        .from("likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("post_id", postId)
        .single()

      const { data: share } = await supabase
        .from("post_shares")
        .select("id")
        .eq("user_id", user.id)
        .eq("post_id", postId)
        .single()

      if (!like || !share) {
        return NextResponse.json({ error: "Quest incomplete: Like and share required" }, { status: 400 })
      }

      await supabase.from("post_unlocks").insert({
        post_id: postId,
        user_id: user.id,
        unlock_type: "quest",
      })

      return NextResponse.json({ success: true, message: "Quest completed" })
    }

    if (unlockType === "subscription") {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("subscriber_id", user.id)
        .eq("creator_id", creatorId)
        .eq("status", "active")
        .single()

      if (!subscription) {
        return NextResponse.json({ error: "No active subscription" }, { status: 400 })
      }

      await supabase.from("post_unlocks").insert({
        post_id: postId,
        user_id: user.id,
        unlock_type: "subscription",
      })

      return NextResponse.json({ success: true, message: "Unlocked with subscription" })
    }

    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("is_paid, price, user_id, is_adult, is_nsfw")
      .eq("id", postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Calculate expected coins from post price
    const expectedCoins = eurToCoins(post.price || 1.5)
    const actualCoins = coinsAmount || expectedCoins

    // Check for existing unlock
    const { data: existingUnlock } = await supabase
      .from("post_unlocks")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single()

    if (existingUnlock) {
      return NextResponse.json({ error: "Post already unlocked" }, { status: 400 })
    }

    // Get user wallet
    const { data: userWallet, error: userWalletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (userWalletError || !userWallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
    }

    if ((userWallet.coins_balance || 0) < actualCoins) {
      return NextResponse.json({ error: "Insufficient coins" }, { status: 402 })
    }

    // Ensure creator wallet exists
    let { data: creatorWallet } = await supabase.from("wallets").select("*").eq("user_id", creatorId).single()

    if (!creatorWallet) {
      const { data: newWallet } = await supabase
        .from("wallets")
        .insert({ user_id: creatorId, coins_balance: 0, available_balance: 0 })
        .select()
        .single()
      creatorWallet = newWallet
    }

    // Calculate splits (80% author, 20% platform)
    const platformCoins = Math.ceil(actualCoins * PLATFORM_SHARE_PERCENT)
    const authorCoins = Math.floor(actualCoins * AUTHOR_SHARE_PERCENT)

    // Process payment atomically
    const { error: updateError } = await supabase.rpc("process_coin_payment", {
      p_user_id: user.id,
      p_creator_id: creatorId,
      p_amount_coins: actualCoins,
      p_author_coins: authorCoins,
      p_post_id: postId,
    })

    if (updateError) {
      console.error("[v0] Coin payment RPC error:", updateError)
      throw updateError
    }

    // Record transaction for history
    const eurAmount = coinsToEur(actualCoins)
    const creatorEur = coinsToEur(authorCoins)

    await supabase.from("wallet_transactions").insert([
      {
        wallet_id: userWallet.id,
        user_id: user.id,
        type: "debit",
        category: "content_unlock",
        amount: eurAmount,
        description: `Unlocked content`,
        metadata: { post_id: postId, coins_spent: actualCoins },
      },
      {
        wallet_id: creatorWallet?.id,
        user_id: creatorId,
        type: "credit",
        category: "earnings",
        amount: creatorEur,
        description: `Content sale`,
        metadata: { post_id: postId, coins_received: authorCoins, buyer_id: user.id },
      },
    ])

    return NextResponse.json({
      success: true,
      message: "Post unlocked successfully",
    })
  } catch (error) {
    console.error("[v0] Wallet unlock error:", error)
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
  }
}
