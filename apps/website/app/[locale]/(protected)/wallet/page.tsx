import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { WalletClient } from "@/components/wallet/wallet-client"
import type { Metadata } from "next"
import { generateSEOMetadata, DEFAULT_SEO } from "@/lib/seo/metadata"

export const metadata: Metadata = generateSEOMetadata({
  title: "Wallet",
  description: "Manage your earnings, top up balance, and withdraw funds on Fantikx.",
  url: `${DEFAULT_SEO.siteUrl}/wallet`,
  type: "website",
  noIndex: true, // Private wallet page should not be indexed
})

export default async function WalletPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", user.id).single()

  const { data: transactions } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  return <WalletClient wallet={wallet} transactions={transactions || []} currentUserId={user.id} />
}
