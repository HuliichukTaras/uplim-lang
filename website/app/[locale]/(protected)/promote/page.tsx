import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PromoteHome } from "@/components/promote/promote-home"
import { getUserPromotions } from "@/lib/promotions/promotion-service"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mini Ads Manager - Promote Your Content | Fantikx",
  description: "Boost your content reach with Fantikx promotion system. Simple, effective content promotion.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function PromotePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userPosts } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_adult", false) // Only non-18+ posts can be promoted
    .order("created_at", { ascending: false })
    .limit(20)

  const promotions = await getUserPromotions(user.id)

  return <PromoteHome promotions={promotions} userId={user.id} userPosts={userPosts || []} />
}
