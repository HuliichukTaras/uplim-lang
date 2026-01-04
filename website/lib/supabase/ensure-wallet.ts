import type { SupabaseClient } from "@supabase/supabase-js"

export async function ensureWallet(supabase: SupabaseClient, userId: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      // Check if wallet exists
      // We wrap this in a try-catch because Supabase client throws on JSON parse errors (e.g. 429 text response)
      const { data: wallet, error: fetchError } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", userId)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw fetchError
      }

      // If wallet doesn't exist, create it
      if (!wallet) {
        console.log("[v0] Creating wallet for user:", userId)
        const { error: createError } = await supabase.from("wallets").insert({
          user_id: userId,
          available_balance: 0,
          pending_balance: 0,
          total_earned: 0,
          total_withdrawn: 0,
          currency: "usd",
        })

        if (createError) {
          throw createError
        }
      }

      return true
    } catch (error: any) {
      // Check for JSON error (often caused by 429 Too Many Requests returning text) or explicit 429
      const isRateLimit =
        error.message?.includes("Too Many Requests") ||
        error.message?.includes("Unexpected token") ||
        error.status === 429

      if (isRateLimit && i < retries - 1) {
        const delay = 1000 * (i + 1)
        console.log(`[v0] Rate limit hit in ensureWallet, retrying in ${delay}ms (${i + 1}/${retries})...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      console.error("[v0] Error checking/creating wallet:", error)
      // If we've exhausted retries or it's a different error, throw it
      if (i === retries - 1) {
        throw new Error("Failed to ensure wallet status after retries")
      }
    }
  }
  return false
}

export const ensureWalletExists = ensureWallet
