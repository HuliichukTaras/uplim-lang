import { createClient } from "@/lib/supabase/server"
import { ReelsFeed } from "@/components/reels/reels-feed"
import { redirect } from "next/navigation"

export default async function ReelsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const { data: reels } = await supabase
    .from("posts")
    .select(`
      *,
      profiles:user_id (
        id,
        handle,
        display_name,
        avatar_url
      ),
      likes!left (
        user_id
      )
    `)
    .eq("post_type", "reel")
    .order("created_at", { ascending: false })
    .limit(10)

  return <ReelsFeed initialReels={reels || []} userId={user.id} />
}
