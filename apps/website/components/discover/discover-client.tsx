"use client"

import { useState, useEffect } from "react"
import { Search, TrendingUp, Clock, Users, Loader2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PostCard } from "@/components/feed/post-card"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface Post {
  id: string
  caption: string
  media_urls: string[]
  video_url: string | null
  is_paid: boolean
  price: number
  is_nsfw: boolean
  is_adult: boolean
  created_at: string
  likes_count: number
  comments_count: number
  views_count: number
  user_id: string
  tags: string[]
  profiles: {
    id: string
    display_name: string
    avatar_url: string
    handle: string
  }
  post_unlocks: Array<{ user_id: string }>
  likes: Array<{ user_id: string }>
}

interface Creator {
  id: string
  display_name: string
  avatar_url: string
  handle: string
}

interface DiscoverClientProps {
  initialPosts: Post[]
  currentUserId: string
}

export function DiscoverClient({ initialPosts, currentUserId }: DiscoverClientProps) {
  const searchParams = useSearchParams()
  const initialTag = searchParams.get("tag")
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [activeTab, setActiveTab] = useState<"trending" | "new" | "top">("trending")
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialPosts.length === 20)
  const [trendingTags, setTrendingTags] = useState<string[]>([])
  const [suggestedCreators, setSuggestedCreators] = useState<Creator[]>([])
  const [selectedTag, setSelectedTag] = useState<string | null>(initialTag)
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const router = useRouter()

  // Handle debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    loadSidebarData()
    if (initialPosts.length === 0) {
      fetchPosts()
    }
  }, [])

  // Refetch posts when tab, tag, or search changes
  useEffect(() => {
    fetchPosts()
  }, [activeTab, selectedTag, debouncedSearch])

  const fetchPosts = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      if (currentUserId) {
        const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", currentUserId)

        if (follows) {
          setFollowingIds(new Set(follows.map((f) => f.following_id)))
        }
      }

      let query = supabase
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
        .limit(20)

      // Apply text search if exists
      if (debouncedSearch) {
        query = query.ilike("caption", `%${debouncedSearch}%`)
      }

      // Apply tag filter
      if (selectedTag) {
        query = query.contains("tags", [selectedTag])
      }

      // Apply sorting
      if (activeTab === "trending") {
        query = query.order("views_count", { ascending: false }).order("created_at", { ascending: false })
      } else if (activeTab === "new") {
        query = query.order("created_at", { ascending: false })
      } else {
        query = query.order("likes_count", { ascending: false }).order("created_at", { ascending: false })
      }

      const { data: newPosts, error } = await query

      if (error) {
        console.error("[v0] Error fetching posts:", error)
        throw error
      }

      setPosts(newPosts || [])
      setHasMore((newPosts?.length || 0) === 20)
    } catch (error) {
      console.error("[v0] Critical error in fetchPosts:", error)
      // Optionally set an error state here
    } finally {
      setLoading(false)
    }
  }

  const loadSidebarData = async () => {
    const supabase = createClient()

    // Load trending tags
    const { data: postsWithTags } = await supabase.from("posts").select("tags").not("tags", "is", null).limit(100)

    if (postsWithTags) {
      const tagCounts: Record<string, number> = {}
      postsWithTags.forEach((post) => {
        post.tags?.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      })
      const sortedTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tag]) => tag)
      setTrendingTags(sortedTags)
    }

    const { data: creators } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, handle")
      .neq("id", currentUserId)
      .limit(5)
      .order("created_at", { ascending: false })

    if (creators) {
      setSuggestedCreators(creators)
    }
  }

  const loadMore = async () => {
    if (loading || !hasMore) return

    setLoading(true)
    const supabase = createClient()

    try {
      let query = supabase
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
        .limit(20)

      if (debouncedSearch) {
        query = query.ilike("caption", `%${debouncedSearch}%`)
      }

      const from = posts.length
      const to = from + 19

      query = query.range(from, to)

      if (activeTab === "trending") {
        query = query.order("views_count", { ascending: false }).order("created_at", { ascending: false })
      } else if (activeTab === "new") {
        query = query.order("created_at", { ascending: false })
      } else {
        query = query.order("likes_count", { ascending: false }).order("created_at", { ascending: false })
      }

      const { data: newPosts, error } = await query

      if (error) throw error

      if (newPosts && newPosts.length > 0) {
        setPosts([...posts, ...newPosts])
        setHasMore(newPosts.length === 20)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error("[v0] Error loading more posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: "trending" | "new" | "top") => {
    setActiveTab(tab)
  }

  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null)
      router.push("/discover", { scroll: false })
    } else {
      setSelectedTag(tag)
      router.push(`/discover?tag=${tag}`, { scroll: false })
    }
  }

  return (
    <div className="w-full bg-background min-h-screen">
      <h1 className="sr-only">Discover - Trending Content and Top Creators on Telloos</h1>

      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-[720px] mx-auto px-4 py-3 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-muted/40 border-transparent focus-visible:bg-background focus-visible:border-primary/20 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center w-full border-b border-border/40">
            <div className="w-full grid grid-cols-3">
              <button
                onClick={() => handleTabChange("trending")}
                className={cn(
                  "flex items-center justify-center gap-2 pb-3 pt-2 border-b-2 font-medium transition-all text-sm",
                  activeTab === "trending"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/5",
                )}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Trending</span>
              </button>

              <button
                onClick={() => handleTabChange("new")}
                className={cn(
                  "flex items-center justify-center gap-2 pb-3 pt-2 border-b-2 font-medium transition-all text-sm",
                  activeTab === "new"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/5",
                )}
              >
                <Clock className="h-4 w-4" />
                <span>New</span>
              </button>

              <button
                onClick={() => handleTabChange("top")}
                className={cn(
                  "flex items-center justify-center gap-2 pb-3 pt-2 border-b-2 font-medium transition-all text-sm",
                  activeTab === "top"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/5",
                )}
              >
                <Users className="h-4 w-4" />
                <span>Top</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[720px] mx-auto bg-background">
        {/* Active Filters Display */}
        {selectedTag && (
          <div className="px-4 py-3 flex items-center justify-between border-b border-border bg-muted/20">
            <span className="text-sm font-medium">
              Filtered by: <span className="text-primary">#{selectedTag}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={() => setSelectedTag(null)} className="h-8 text-xs">
              Clear Filter
            </Button>
          </div>
        )}

        <div className="min-h-[50vh]">
          {loading && posts.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold mb-2">No results found</h2>
              <p className="text-muted-foreground max-w-xs">
                {debouncedSearch
                  ? `We couldn't find anything matching "${debouncedSearch}"`
                  : "Try adjusting your filters or search query"}
              </p>
              {selectedTag && (
                <Button variant="link" onClick={() => setSelectedTag(null)} className="mt-4">
                  Clear tag filter
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {posts.map((post) => {
                const needsUnlock = post.is_paid || post.is_nsfw || post.is_adult
                const isUnlocked =
                  !needsUnlock ||
                  post.profiles.id === currentUserId ||
                  post.post_unlocks?.some((u) => u.user_id === currentUserId)

                const initialLiked = post.likes?.some((l) => l.user_id === currentUserId)
                const initialIsFollowing = followingIds.has(post.user_id)

                return (
                  <PostCard
                    key={post.id}
                    post={post}
                    isUnlocked={isUnlocked}
                    currentUserId={currentUserId}
                    onUnlockClick={() => setSelectedPost(post)}
                    initialLiked={initialLiked}
                    initialIsFollowing={initialIsFollowing}
                  />
                )
              })}
            </div>
          )}

          {hasMore && posts.length > 0 && (
            <div className="flex justify-center py-8">
              <Button onClick={loadMore} disabled={loading} variant="ghost" className="text-muted-foreground">
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
        </div>
      </main>
    </div>
  )
}
