import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PromoteCreate } from "@/components/promote/promote-create"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create Promotion | Fantikx",
  description: "Boost your content reach with targeted promotion",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function PromoteCreatePage({ searchParams }: { searchParams: Promise<{ post?: string }> }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { post: postId } = await searchParams

  if (!postId) {
    redirect("/promote")
  }

  const { data: post } = await supabase
    .from("posts")
    .select(
      `
      *,
      profiles!user_id (
        id,
        display_name,
        handle,
        avatar_url
      )
    `,
    )
    .eq("id", postId)
    .eq("user_id", user.id)
    .single()

  if (!post) {
    redirect("/promote")
  }

  const { data: wallet } = await supabase.from("wallets").select("available_balance").eq("user_id", user.id).single()

  return <PromoteCreate post={post} userId={user.id} initialBalance={wallet?.available_balance || 0} />
}
