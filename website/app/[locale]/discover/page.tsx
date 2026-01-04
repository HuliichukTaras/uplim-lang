import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DiscoverClient } from "@/components/discover/discover-client"
import type { Metadata } from "next"
import { generateSEOMetadata, DEFAULT_SEO } from "@/lib/seo/metadata"

export const revalidate = 0
export const dynamic = "force-dynamic"

export const metadata: Metadata = generateSEOMetadata({
  title: "Discover",
  description:
    "Discover trending content and top creators on Fantikx. Find exclusive posts, follow your favorite creators, and explore new content.",
  url: `${DEFAULT_SEO.siteUrl}/discover`,
  type: "website",
})

export default async function DiscoverPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const { data: posts } = await supabase
    .from("posts")
    .select(`
      *,
      profiles!user_id (
        id,
        display_name,
        avatar_url,
        handle
      ),
      post_unlocks!left (
        user_id
      ),
      likes!left (
        user_id
      )
    `)
    .order("views_count", { ascending: false })
    .limit(20)

  return <DiscoverClient initialPosts={posts || []} currentUserId={user.id} />
}
