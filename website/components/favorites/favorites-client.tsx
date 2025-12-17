"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { PostCard } from "@/components/feed/post-card"
import { Loader2, Heart } from "lucide-react"

interface FavoritePost {
  id: string
  user_id: string
  caption: string | null
  media_urls: string[]
  video_url: string | null
  created_at: string
  likes_count: number
  comments_count: number
  shares_count: number
  views_count: number
  is_paid: boolean
  ppv_price_cents: number | null
  is_adult: boolean
  blur_required: boolean
  profiles: {
    id: string
    display_name: string | null
    handle: string | null
    avatar_url: string | null
  }
}

interface FavoritesClientProps {
  userId: string
}

export function FavoritesClient({ userId }: FavoritesClientProps) {
  const [favorites, setFavorites] = useState<FavoritePost[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadFavorites() {
      try {
        const { data, error } = await supabase
          .from("post_favorites")
          .select(
            `
            post_id,
            posts:post_id (
              id,
              user_id,
              caption,
              media_urls,
              video_url,
              created_at,
              likes_count,
              comments_count,
              shares_count,
              views_count,
              is_paid,
              ppv_price_cents,
              is_adult,
              blur_required,
              profiles:user_id (
                id,
                display_name,
                handle,
                avatar_url
              )
            )
          `,
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false })

        if (error) throw error

        const favoritePosts = (data || []).map((item: any) => item.posts).filter(Boolean)

        setFavorites(favoritePosts)
      } catch (error) {
        console.error("[v0] Error loading favorites:", error)
      } finally {
        setLoading(false)
      }
    }

    loadFavorites()
  }, [userId, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Heart className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No favorites yet</h2>
        <p className="text-muted-foreground max-w-sm">
          When you favorite posts, they'll appear here so you can easily find them later.
        </p>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Favorites</h1>
      <div className="space-y-4">
        {favorites.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
