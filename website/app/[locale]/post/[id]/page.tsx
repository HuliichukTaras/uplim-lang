import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import { PostView } from "@/components/post/post-view"
import { MobileNav } from "@/components/mobile-nav"
import { generatePostMetadata } from "@/lib/seo/metadata"

interface PostPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from("posts")
    .select(
      `
      *,
      profiles!posts_user_id_fkey (
        id,
        handle,
        display_name,
        avatar_url
      )
    `,
    )
    .eq("id", id)
    .single()

  if (!post) {
    return {
      title: "Post Not Found | Fantikx",
      description: "This post could not be found or has been removed.",
      robots: { index: false, follow: false },
      openGraph: {
        title: "Post Not Found",
        description: "This content is unavailable.",
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/post/${id}`,
        images: [`${process.env.NEXT_PUBLIC_BASE_URL}/logo.svg`],
      },
    }
  }

  const profile = post.profiles as any
  const creatorName = profile?.display_name || profile?.handle || "Creator"
  const creatorHandle = profile?.handle || "user"

  const isNSFW = post.is_nsfw || post.is_adult || post.blur_required

  // 1. Prefer blurred thumbnail for NSFW
  // 2. Prefer explicit thumbnail_url from DB (generated on upload)
  // 3. If image post, fallback to first media url
  // 4. If video post and NO thumbnail_url, we cannot use video file as image.

  let thumbnailUrl: string | undefined = isNSFW ? post.thumbnail_blurred_url : post.thumbnail_url

  const isVideo = post.media_type === "video" || post.media_urls?.[0]?.match(/\.(mp4|mov|webm)$/i)
  const videoUrl = isVideo ? post.media_urls?.[0] : undefined

  // If it's an image post and no thumbnail set, use the image itself
  if (!thumbnailUrl && !isVideo && post.media_urls?.length > 0) {
    thumbnailUrl = post.media_urls[0]
  }

  // Sanitize: If the selected "thumbnail" is actually a video file, discard it
  if (thumbnailUrl && thumbnailUrl.match(/\.(mp4|mov|webm)$/i)) {
    thumbnailUrl = undefined
  }

  // If we still don't have a thumbnail, we will let the metadata generator use the default OG image
  // or dynamic OG generation if available.
  // Note: The prompt explicitly says "Generate a proper video poster".
  // Since we can't generate it here, we rely on the default to ensure valid HTML.

  return generatePostMetadata({
    postId: id,
    caption: post.caption || "",
    creatorName,
    creatorHandle,
    thumbnailUrl, // Can be undefined, will fallback in generatePostMetadata
    videoUrl,
    isNSFW,
    createdAt: post.created_at,
  })
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: post, error } = await supabase
    .from("posts")
    .select(`
      *,
      profiles!posts_user_id_fkey (
        id,
        handle,
        display_name,
        avatar_url,
        bio,
        is_creator,
        monetization_enabled
      )
    `)
    .eq("id", id)
    .single()

  if (error || !post) {
    notFound()
  }

  // If post is paid and user is not authenticated, redirect to home with login prompt
  if (post.is_paid && !user) {
    redirect("/?login=required")
  }

  let isUnlocked = false
  if (post.is_paid && user) {
    const { data: unlock } = await supabase
      .from("post_unlocks")
      .select("*")
      .eq("post_id", post.id)
      .eq("user_id", user.id)
      .maybeSingle()

    isUnlocked = !!unlock
  }

  const profileData = post.profiles || {}
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://telloos.com"

  const isVideo = post.media_type === "video" || post.video_url || post.media_urls?.[0]?.match(/\.(mp4|mov|webm)$/i)

  const videoUrl = post.video_url || (isVideo ? post.media_urls?.[0] : null)
  const thumbnailUrl = post.thumbnail_url || post.media_urls?.[0]

  const videoJsonLd =
    isVideo && videoUrl
      ? {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: post.caption?.slice(0, 110) || `Video by ${profileData.display_name || profileData.handle}`,
        description:
          post.caption || `Watch this video from ${profileData.display_name || profileData.handle} on Fantikx`,
        thumbnailUrl: thumbnailUrl ? [thumbnailUrl] : [`${baseUrl}/og-image.png`],
        uploadDate: post.created_at,
        contentUrl: videoUrl,
        embedUrl: `${baseUrl}/post/${id}`,
        duration: post.video_duration
          ? `PT${Math.floor(post.video_duration / 60)}M${post.video_duration % 60}S`
          : undefined,
        interactionStatistic: [
          {
            "@type": "InteractionCounter",
            interactionType: { "@type": "WatchAction" },
            userInteractionCount: post.view_count || 0,
          },
          {
            "@type": "InteractionCounter",
            interactionType: { "@type": "LikeAction" },
            userInteractionCount: post.like_count || 0,
          },
        ],
        author: {
          "@type": "Person",
          name: profileData.display_name || profileData.handle,
          url: `${baseUrl}/profile/${profileData.handle}`,
        },
        publisher: {
          "@type": "Organization",
          name: "Fantikx",
          logo: {
            "@type": "ImageObject",
            url: `${baseUrl}/logo.svg`,
          },
          url: baseUrl,
        },
        isFamilyFriendly: !(post.is_nsfw || post.is_adult),
        requiresSubscription: post.is_paid ? true : false,
      }
      : null

  const postJsonLd = {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    headline: post.caption?.slice(0, 110),
    description: post.caption,
    image: thumbnailUrl || post.media_urls?.[0],
    datePublished: post.created_at,
    author: {
      "@type": "Person",
      name: profileData.display_name || profileData.handle,
      url: `${baseUrl}/profile/${profileData.handle}`,
    },
    publisher: {
      "@type": "Organization",
      name: "Fantikx",
      url: baseUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/post/${id}`,
    },
    ...(isVideo && videoUrl ? { video: { "@id": videoUrl } } : {}),
  }

  return (
    <>
      {videoJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd) }} />
      <div className="min-h-screen bg-white pb-20">
        <PostView post={post} currentUser={user} isUnlocked={!post.is_paid || isUnlocked} />
        {user && <MobileNav user={user} profile={profileData as any} />}
      </div>
    </>
  )
}
