import { createClient } from "@/lib/supabase/server"
import { FeedClient } from "@/components/feed/feed-client"
import { FeedLayout } from "@/components/layout/feed-layout"
import { RightPanel } from "@/components/layout/right-panel"
import { SuggestedUsers } from "@/components/layout/suggested-users"
import type { Metadata } from "next"
import { generateSEOMetadata, DEFAULT_SEO } from "@/lib/seo/metadata"

export const metadata: Metadata = generateSEOMetadata({
  title: "Feed",
  description: "Discover exclusive content from creators you follow on Fantikx.",
  url: `${DEFAULT_SEO.siteUrl}/feed`,
  type: "website",
})

export default async function FeedPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    profile = data
  }

  const { data: posts } = await supabase
    .from("posts")
    .select(`
      *,
      profiles!user_id (
        id,
        display_name,
        handle,
        avatar_url
      ),
      post_unlocks!left (
        user_id
      ),
      likes!left (
        user_id
      )
    `)
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <FeedLayout
      rightSidebar={
        <RightPanel title="Suggestions">
          <SuggestedUsers />
        </RightPanel>
      }
    >
      <FeedClient initialPosts={posts || []} currentUserId={user?.id || null} userProfile={profile} />
    </FeedLayout>
  )
}
