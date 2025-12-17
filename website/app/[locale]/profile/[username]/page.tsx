import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ModernProfileClient } from "@/components/profile/modern-profile-client"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { UserX } from "lucide-react"
import type { Metadata } from "next"
import { generateProfileMetadata } from "@/lib/seo/metadata"

interface ProfilePageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase.from("profiles").select("*").ilike("handle", username).maybeSingle()

  if (!profile) {
    return {
      title: "Profile Not Found | Fantikx",
      description: "This profile could not be found.",
      robots: { index: false, follow: false },
    }
  }

  // Get followers count for metadata
  const { count: followersCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", profile.id)

  const isThinContent = (!profile.bio || profile.bio.length < 10) && !profile.is_creator

  return generateProfileMetadata({
    handle: profile.handle,
    displayName: profile.display_name || profile.handle,
    bio: profile.bio,
    avatarUrl: profile.avatar_url,
    followersCount: followersCount || 0,
    isCreator: profile.is_creator,
    noIndex: isThinContent,
  })
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check handle history for redirects (SEO link mass preservation)
  const { data: handleHistory } = await supabase
    .from("handle_history")
    .select("new_handle")
    .eq("old_handle", username)
    .order("changed_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (handleHistory) {
    // Redirect to new handle (using clean URL)
    redirect(`/${handleHistory.new_handle}`)
  }

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username)

  let query = supabase.from("profiles").select("*")

  if (isUUID) {
    query = query.eq("id", username)
  } else {
    query = query.ilike("handle", username)
  }

  const { data: profile, error: profileError } = await query.maybeSingle()

  if (!profile && isUUID && user) {
    redirect("/settings?setup=true")
  }

  if (profileError || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-gray-100 p-6">
              <UserX className="h-16 w-16 text-gray-400" />
            </div>
          </div>

          <h1 className="mb-2 text-3xl font-bold text-gray-900">Profile Not Found</h1>

          <p className="mb-8 text-gray-600">
            Sorry, we couldn't find the profile you're looking for.
            <br />
            It may have been deleted or the username might be incorrect.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/feed">Go to Feed</Link>
            </Button>

            <Button variant="outline" asChild>
              <Link href="/discover">Discover Creators</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Redirect to canonical URL if case doesn't match
  if (profile.handle && profile.handle.toLowerCase() !== username.toLowerCase()) {
    redirect(`/${profile.handle}`)
  }

  const { data: posts } = await supabase
    .from("posts")
    .select(`
      *,
      post_unlocks!left (
        user_id
      )
    `)
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })

  const { data: followData } = user
    ? await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", profile.id)
        .maybeSingle()
    : { data: null }

  const isFollowing = !!followData

  const { count: followersCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", profile.id)

  const { count: followingCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", profile.id)

  const isOwnProfile = user?.id === profile.id

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://fantikx.com"

  // Use clean URL in structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.display_name || profile.handle,
    alternateName: `@${profile.handle}`,
    description: profile.bio || `Check out ${profile.display_name || profile.handle}'s exclusive content on Fantikx.`,
    image: profile.avatar_url,
    url: `${baseUrl}/${profile.handle}`,
    sameAs: profile.link_in_bio ? [profile.link_in_bio] : [],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ModernProfileClient
        profile={profile}
        posts={posts || []}
        currentUserId={user?.id || ""}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        followersCount={followersCount || 0}
        followingCount={followingCount || 0}
      />
    </>
  )
}
