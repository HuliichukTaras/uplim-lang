import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import LiveStreamViewer from "@/components/live/livestream-viewer"
import type { Metadata } from "next"
import { generateSEOMetadata, DEFAULT_SEO } from "@/lib/seo/metadata"

interface LiveStreamPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: LiveStreamPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: livestream } = await supabase
    .from("livestreams")
    .select(`
      *,
      creator:profiles!creator_id (
        handle,
        display_name
      )
    `)
    .eq("id", id)
    .single()

  if (!livestream) {
    return {
      title: "Live Stream Not Found | Fantikx",
      robots: { index: false, follow: false },
    }
  }

  const creator = livestream.creator as any
  const creatorName = creator?.display_name || creator?.handle || "Creator"
  const title = livestream.title || `${creatorName}'s Live Stream`

  return generateSEOMetadata({
    title: `${title} | Live on Fantikx`,
    description: livestream.description || `Watch ${creatorName} live on Fantikx.`,
    image: livestream.thumbnail_url,
    url: `${DEFAULT_SEO.siteUrl}/live/${id}`,
    type: "website",
    author: creatorName,
  })
}

export default async function LiveStreamPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get livestream
  const { data: livestream } = await supabase
    .from("livestreams")
    .select(`
      *,
      creator:profiles!creator_id (
        id,
        handle,
        display_name,
        avatar_url
      )
    `)
    .eq("id", id)
    .single()

  if (!livestream) {
    notFound()
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Check if user follows creator
  const { data: follow } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", livestream.creator_id)
    .maybeSingle()

  const isSubscribed = !!follow || livestream.creator_id === user.id

  return (
    <LiveStreamViewer
      livestream={livestream}
      currentUser={profile}
      isSubscribed={isSubscribed}
      isCreator={livestream.creator_id === user.id}
    />
  )
}
