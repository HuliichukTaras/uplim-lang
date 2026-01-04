"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Link } from "@/i18n/navigation"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Settings, MessageCircle, Share2, Plus, DollarSign, Play, Lock, Coins } from "lucide-react"
import { HeartIcon, CommentIcon } from "@/components/flaticon-icons"
import { ProfileHeader } from "./profile-header"
import { ProfileTabs } from "./profile-tabs"
import { ProfileStats } from "./profile-stats"
import { CreatorToolbar } from "./creator-toolbar"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { cn, normalizeUrl } from "@/lib/utils"
import { eurToCoins } from "@/lib/wallet"
import { DynamicGradientOverlay } from "@/components/dynamic-gradient-overlay"

interface Post {
  id: string
  media_urls: string[]
  content_type: string
  is_nsfw: boolean
  is_locked: boolean
  ppv_price_cents?: number
  caption?: string
  likes_count: number
  comments_count: number
  video_url?: string
  is_paid?: boolean
  is_adult?: boolean
  is_unlocked?: boolean
  price?: number
}

interface Profile {
  id: string
  handle: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  link_in_bio: string | null
  is_creator: boolean
  monetization_enabled: boolean
}

interface ModernProfileClientProps {
  profile: Profile
  posts: Post[]
  currentUserId: string
  isOwnProfile: boolean
  isFollowing: boolean
  followersCount: number
  followingCount: number
}

export function ModernProfileClient({
  profile: initialProfile,
  posts: initialPosts,
  currentUserId,
  isOwnProfile,
  isFollowing: initialIsFollowing,
  followersCount: initialFollowersCount,
  followingCount: initialFollowingCount,
}: ModernProfileClientProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [posts, setPosts] = useState(initialPosts)
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [followersCount, setFollowersCount] = useState(initialFollowersCount)
  const [activeTab, setActiveTab] = useState<"posts" | "reels" | "locked" | "about">("posts")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const supabase = createClient()

    const profileChannel = supabase
      .channel(`profile-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${profile.id}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setProfile(payload.new as Profile)
          }
        },
      )
      .subscribe()

    const postsChannel = supabase
      .channel(`posts-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
          filter: `user_id=eq.${profile.id}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            setPosts((prev) => [payload.new as Post, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setPosts((prev) => prev.map((p) => (p.id === payload.new.id ? (payload.new as Post) : p)))
          } else if (payload.eventType === "DELETE") {
            setPosts((prev) => prev.filter((p) => p.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    const followsChannel = supabase
      .channel(`follows-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "follows",
          filter: `following_id=eq.${profile.id}`,
        },
        async () => {
          const { count } = await supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_id", profile.id)

          if (count !== null) {
            setFollowersCount(count)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(profileChannel)
      supabase.removeChannel(postsChannel)
      supabase.removeChannel(followsChannel)
    }
  }, [profile.id])

  const handleFollow = async () => {
    try {
      const response = await fetch("/api/follow", {
        method: isFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: profile.id }),
      })

      if (response.ok) {
        setIsFollowing(!isFollowing)
        setFollowersCount((prev) => (isFollowing ? prev - 1 : prev + 1))
      }
    } catch (error) {
      console.error("Error following/unfollowing:", error)
    }
  }

  const handleMessage = () => {
    router.push(`/messages?user=${profile.handle}`)
  }

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/${profile.handle}`

    if (navigator.share && navigator.canShare({ url: profileUrl })) {
      try {
        await navigator.share({
          title: `${profile.display_name || profile.handle}'s profile`,
          text: `Check out ${profile.display_name || profile.handle} on Telloos`,
          url: profileUrl,
        })
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error)
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(profileUrl)
        toast({
          title: "Link copied!",
          description: "Profile link copied to clipboard",
        })
      } catch (error) {
        console.error("Error copying to clipboard:", error)
        toast({
          title: "Error",
          description: "Failed to copy link",
          variant: "destructive",
        })
      }
    }
  }

  const regularPosts = posts.filter((p) => p.content_type !== "video")
  const reelPosts = posts.filter((p) => p.content_type === "video")
  const lockedPosts = posts.filter((p) => p.is_locked || p.is_nsfw)

  const displayedPosts =
    activeTab === "posts" ? regularPosts : activeTab === "reels" ? reelPosts : activeTab === "locked" ? lockedPosts : []

  const seoDescription = `
    Welcome to the official Telloos profile of ${profile.display_name || profile.handle}. 
    Join Telloos today to follow @${profile.handle}, unlock exclusive photos and videos, 
    and support this creator directly. Telloos is the premier platform for connecting 
    creators with their biggest fans.
  `

  return (
    <div className="min-h-screen bg-background pb-20">
      {isOwnProfile && (
        <CreatorToolbar
          followersCount={followersCount}
          monetizationEnabled={profile.monetization_enabled || false}
          isCreator={profile.is_creator}
        />
      )}

      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <ProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          isFollowing={isFollowing}
          onFollow={handleFollow}
        />

        <ProfileStats
          postsCount={posts.length}
          followersCount={followersCount}
          followingCount={initialFollowingCount}
        />

        {profile.bio && (
          <div className="mt-4">
            <p className="text-sm text-foreground whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}

        {profile.link_in_bio && (
          <div className="mt-2">
            <a
              href={normalizeUrl(profile.link_in_bio)}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              {profile.link_in_bio}
            </a>
          </div>
        )}

        {!isOwnProfile && (
          <div className="mt-6 flex gap-3">
            <Button
              onClick={handleFollow}
              className="flex-1 h-9 rounded-lg font-semibold"
              variant={isFollowing ? "outline" : "default"}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
            <Button
              onClick={handleMessage}
              variant="outline"
              className="flex-1 h-9 rounded-lg font-semibold bg-transparent"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
            <Button onClick={handleShare} variant="outline" size="icon" className="h-9 w-9 rounded-lg bg-transparent">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        )}

        {isOwnProfile && (
          <div className="mt-6 flex gap-3">
            <Button asChild variant="outline" className="flex-1 h-9 rounded-lg font-semibold bg-transparent">
              <Link href="/settings">
                <Settings className="w-4 h-4 mr-2" />
                Edit Profile
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 h-9 rounded-lg font-semibold bg-transparent">
              <Link href="/dashboard">
                <DollarSign className="w-4 h-4 mr-2" />
                Earnings
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="border-t border-border sticky top-0 bg-background z-10">
        <div className="max-w-[1200px] mx-auto">
          <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-6">
        {displayedPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No {activeTab} yet</p>
            {isOwnProfile && (
              <Button asChild className="mt-4" size="sm">
                <Link href="/upload">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 md:gap-2">
            {displayedPosts.map((post) => {
              const isVideo =
                post.content_type === "video" || post.media_urls?.[0]?.match(/\.(mp4|mov|webm)$/i) || !!post.video_url
              const mediaUrl = post.video_url || post.media_urls?.[0] || "/placeholder.svg"
              const isLocked = (post.is_paid || post.is_adult || post.is_nsfw) && !post.is_unlocked
              const priceEur = post.price || 1.5
              const priceInCoins = eurToCoins(priceEur)

              return (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="relative aspect-square bg-muted rounded-sm overflow-hidden group"
                >
                  {isVideo ? (
                    <video
                      src={mediaUrl}
                      className={cn(
                        "w-full h-full transition-all duration-300 absolute inset-0",
                        isLocked ? "object-cover scale-105" : "object-cover",
                      )}
                      muted
                      playsInline
                      loop
                      preload="metadata"
                      onMouseOver={(e) => !isLocked && e.currentTarget.play()}
                      onMouseOut={(e) => {
                        if (!isLocked) {
                          e.currentTarget.pause()
                          e.currentTarget.currentTime = 0
                        }
                      }}
                    />
                  ) : (
                    <Image
                      src={mediaUrl || "/placeholder.svg"}
                      alt={post.caption || "Post"}
                      fill
                      className={cn(
                        "transition-all duration-300",
                        isLocked ? "object-cover scale-105" : "object-cover",
                      )}
                    />
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white z-10 pointer-events-none">
                    <span className="flex items-center gap-1">
                      <HeartIcon className="w-5 h-5" filled={true} />
                      {post.likes_count || 0}
                    </span>
                    {post.comments_count > 0 && (
                      <span className="flex items-center gap-1">
                        <CommentIcon className="w-5 h-5" />
                        {post.comments_count}
                      </span>
                    )}
                  </div>

                  {isLocked && (
                    <>
                      <DynamicGradientOverlay />
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-20 pointer-events-none">
                        <Lock className="w-8 h-8 text-white mb-2 drop-shadow-lg" />
                        <div className="flex items-center gap-1 text-amber-400 font-bold text-xl drop-shadow-lg">
                          {priceInCoins} <Coins className="w-5 h-5" />
                        </div>
                      </div>
                    </>
                  )}

                  {isVideo && !isLocked && (
                    <div className="absolute top-2 right-2 z-20 pointer-events-none">
                      <Play className="w-5 h-5 text-white drop-shadow-md" fill="currentColor" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-8 mt-8 border-t border-border/50 text-center md:text-left">
        <h2 className="text-lg font-semibold mb-2">About {profile.display_name || profile.handle}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl">
          {profile.bio ? profile.bio : "This creator hasn't written a bio yet."}
        </p>
        <p className="text-muted-foreground/60 text-xs mt-4 leading-relaxed max-w-3xl">{seoDescription}</p>
      </div>
    </div>
  )
}
