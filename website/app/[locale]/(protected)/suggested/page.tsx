import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SuggestedPageClient } from "@/components/suggested/suggested-page-client"

export const dynamic = "force-dynamic"

export default async function SuggestedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  // Get users the current user is already following
  const { data: followsData } = await supabase.from("follows").select("following_id").eq("follower_id", user.id)

  const followingIds = new Set(followsData?.map((f) => f.following_id) || [])

  // Fetch potential suggestions (exclude current user)
  // We fetch more than we need to filter out following on client if needed,
  // but better to filter here if possible or fetch a reasonable batch
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_url, bio")
    .neq("id", user.id)
    .limit(100)
    .order("created_at", { ascending: false })

  // Filter out users already followed
  const suggestions = profiles?.filter((p) => !followingIds.has(p.id)) || []

  return (
    <SuggestedPageClient
      initialUsers={suggestions}
      currentUserId={user.id}
      initialFollowing={Array.from(followingIds)}
    />
  )
}
