"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { PostCard } from "./post-card"
import { Button } from "@/components/ui/button"
import { Loader2, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface Post {
  id: string
  caption: string
  media_urls: string[]
  video_url: string | null
  is_paid: boolean
  price: number
  is_nsfw: boolean
  created_at: string
  likes_count: number
  comments_count: number
  views_count: number
  shares_count: number
  user_id: string
  profiles: {
    id: string
    display_name: string
    handle: string
    avatar_url: string
  }
  post_unlocks: Array<{ user_id: string }>
  likes: Array<{ user_id: string }>
}

interface FeedClientProps {
  initialPosts: Post[]
  currentUserId: string | null
  userProfile: any
}

export function FeedClient({ initialPosts, currentUserId, userProfile }: FeedClientProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [filter, setFilter] = useState<"all" | "following">("all")
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialPosts.length === 20)
  const [seenPromotionIds, setSeenPromotionIds] = useState<string[]>([])
  const [followingIds, setFollowingIds] = useState<string[]>([])
  const router = useRouter()
  const initialLoadDone = useRef(false)

  const injectPromotedPost = useCallback(
    async (organicPosts: Post[]) => {
      try {
        const response = await fetch("/api/promotions/get-for-feed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seenPromotionIds }),
        })

        if (!response.ok) return organicPosts

        const { promotion } = await response.json()

        if (!promotion) return organicPosts

        setSeenPromotionIds((prev) => [...prev, promotion.id])

        const result: any[] = []
        const INJECT_FREQUENCY = 7

        organicPosts.forEach((post, index) => {
          result.push(post)

          if ((index + 1) % INJECT_FREQUENCY === 0) {
            result.push({
              ...promotion.posts,
              isPromoted: true,
              promotionId: promotion.id,
            })
          }
        })

        return result
      } catch (error) {
        console.log("[v0] Error injecting promoted posts:", error)
        return organicPosts
      }
    },
    [seenPromotionIds],
  )

  const fetchFollowingIds = useCallback(async () => {
    if (!currentUserId) return []
    const supabase = createClient()
    const { data } = await supabase.from("follows").select("following_id").eq("follower_id", currentUserId)
    const ids = data?.map((f) => f.following_id) || []
    setFollowingIds(ids)
    return ids
  }, [currentUserId])

  useEffect(() => {
    const injectInitial = async () => {
      const postsWithPromo = await injectPromotedPost(initialPosts)
      if (postsWithPromo.length !== initialPosts.length) {
        setPosts(postsWithPromo)
      }
    }
    injectInitial()
  }, []) // Run only once on mount

  useEffect(() => {
    // Skip the first run as initialPosts covers "all"
    if (!initialLoadDone.current) {
      initialLoadDone.current = true
      return
    }

    const switchFeed = async () => {
      setLoading(true)
      setPosts([])
      setHasMore(true)

      const supabase = createClient()
      let query = supabase
        .from("posts")
        .select(
          `
        *,
        profiles:user_id (
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
      `,
        )
        .order("created_at", { ascending: false })
        .limit(20)

      if (filter === "following") {
        if (!currentUserId) {
          setLoading(false)
          setPosts([])
          setHasMore(false)
          return
        }

        // Ensure we have following IDs
        let ids = followingIds
        if (ids.length === 0) {
          ids = await fetchFollowingIds()
        }

        if (ids.length === 0) {
          setLoading(false)
          setPosts([])
          setHasMore(false)
          return
        }

        query = query.in("user_id", ids)
      }

      const { data: newPosts } = await query

      if (newPosts) {
        // Inject ads only for "all" feed usually, but let's keep it for both if requested.
        // For now, keeping it simple: inject for both.
        const postsWithPromo = await injectPromotedPost(newPosts as any)
        setPosts(postsWithPromo)
        setHasMore(newPosts.length === 20)
      } else {
        setPosts([])
        setHasMore(false)
      }

      setLoading(false)
    }

    switchFeed()
  }, [filter, currentUserId]) // Removed followingIds dependency to avoid loops, we fetch it inside if needed

  const loadMore = async () => {
    if (loading || !hasMore) return

    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from("posts")
      .select(`
        *,
        profiles:user_id (
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
      .lt("created_at", posts[posts.length - 1].created_at)
      .limit(20)

    if (filter === "following") {
      // If we are in following mode, we must use the followingIds
      if (followingIds.length > 0) {
        query = query.in("user_id", followingIds)
      } else {
        // Should not happen if we have posts, but safety check
        setLoading(false)
        return
      }
    }

    const { data: newPosts } = await query

    if (newPosts && newPosts.length > 0) {
      const postsWithPromo = await injectPromotedPost(newPosts as any)
      setPosts([...posts, ...postsWithPromo])
      setHasMore(newPosts.length === 20)
    } else {
      setHasMore(false)
    }

    setLoading(false)
  }

  return (
    <div className="w-full bg-white min-h-screen">
      <h1 className="sr-only">Your Feed - Exclusive Content from Creators You Follow</h1>

      <div className="sticky top-0 md:top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-[720px] mx-auto px-0 py-0 flex items-center justify-around">
          <button
            onClick={() => setFilter("all")}
            className={`relative flex-1 py-4 text-sm font-semibold transition-colors ${
              filter === "all" ? "text-black" : "text-gray-400"
            }`}
          >
            For You
            {filter === "all" && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" />}
          </button>
          <button
            onClick={() => setFilter("following")}
            className={`relative flex-1 py-4 text-sm font-semibold transition-colors ${
              filter === "following" ? "text-black" : "text-gray-400"
            }`}
          >
            Following
            {filter === "following" && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" />}
          </button>
        </div>
      </div>

      <main className="max-w-[720px] mx-auto bg-white">
        {posts.length === 0 && !loading ? (
          filter === "following" ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <UserPlus className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No following posts yet</h2>
              <p className="text-gray-500 mb-6 max-w-sm">
                {currentUserId
                  ? "Subscribe to creators to see their exclusive content here."
                  : "Log in to see posts from creators you follow."}
              </p>
              <Button asChild>
                <a href="/discover">Find Creators</a>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">No posts yet</h2>
              <p className="text-gray-500 text-center mb-6">Follow creators or explore to see content</p>
              <Button asChild>
                <a href="/discover">Explore Now</a>
              </Button>
            </div>
          )
        ) : (
          <>
            <div>
              {posts.map((post, index) => {
                const needsUnlock = post.is_paid || post.is_nsfw || (post as any).is_adult
                const isUnlocked =
                  !needsUnlock ||
                  post.profiles.id === currentUserId ||
                  post.post_unlocks?.some((u: any) => u.user_id === currentUserId)

                return (
                  <PostCard
                    key={`${post.id}-${index}`}
                    post={post}
                    isUnlocked={isUnlocked}
                    currentUserId={currentUserId}
                    onUnlockClick={() => setSelectedPost(post)}
                    priority={index < 2}
                  />
                )
              })}
            </div>

            {hasMore && (
              <div className="flex justify-center py-8 bg-white border-t border-gray-200">
                <Button
                  onClick={loadMore}
                  disabled={loading}
                  variant="outline"
                  size="lg"
                  className="min-w-[200px] bg-transparent"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}

            {!hasMore && posts.length > 0 && (
              <div className="text-center py-8 text-gray-500 text-sm bg-white border-t border-gray-200">
                You've reached the end
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
