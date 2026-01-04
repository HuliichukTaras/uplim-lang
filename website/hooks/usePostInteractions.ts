"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface UsePostInteractionsOptions {
  postId: string
  currentUserId: string | null
  creatorId?: string // Added creatorId to trigger notifications
  initialLikes?: number
  initialComments?: number
  initialShares?: number
  initialLiked?: boolean
  initialFavorited?: boolean
  skipFetch?: boolean
}

export function usePostInteractions({
  postId,
  currentUserId,
  creatorId,
  initialLikes = 0,
  initialComments = 0,
  initialShares = 0,
  initialLiked = false,
  initialFavorited = false,
  skipFetch = false,
}: UsePostInteractionsOptions) {
  const [liked, setLiked] = useState(initialLiked)
  const [favorited, setFavorited] = useState(initialFavorited)
  const [likesCount, setLikesCount] = useState(initialLikes)
  const [commentsCount, setCommentsCount] = useState(initialComments)
  const [sharesCount, setSharesCount] = useState(initialShares)
  const [loading, setLoading] = useState(!skipFetch)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!currentUserId || skipFetch) {
      setLoading(false)
      return
    }

    const fetchInteractionState = async () => {
      try {
        // Fetch like and favorite status in parallel
        const [likeResult, favoriteResult, countsResult] = await Promise.all([
          supabase.from("likes").select("id").eq("post_id", postId).eq("user_id", currentUserId).maybeSingle(),
          supabase.from("post_favorites").select("id").eq("post_id", postId).eq("user_id", currentUserId).maybeSingle(),
          supabase.from("posts").select("likes_count, comments_count, shares_count").eq("id", postId).single(),
        ])

        console.log("[v0] Interaction state fetched:", {
          postId,
          liked: !!likeResult.data,
          favorited: !!favoriteResult.data,
          counts: countsResult.data,
        })

        setLiked(!!likeResult.data)
        setFavorited(!!favoriteResult.data)

        if (countsResult.data) {
          setLikesCount(countsResult.data.likes_count || 0)
          setCommentsCount(countsResult.data.comments_count || 0)
          setSharesCount(countsResult.data.shares_count || 0)
        }
      } catch (error) {
        console.error("[v0] Error fetching interaction state:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInteractionState()
  }, [postId, currentUserId, skipFetch])

  const handleLike = useCallback(async () => {
    if (!currentUserId) return false

    const previousLiked = liked
    const previousCount = likesCount

    const newLiked = !liked
    setLiked(newLiked)
    setLikesCount((prev) => (newLiked ? prev + 1 : Math.max(0, prev - 1)))

    try {
      if (newLiked) {
        const { error: insertError } = await supabase.from("likes").insert({
          user_id: currentUserId,
          post_id: postId,
        })

        if (insertError) throw insertError

        const { error: updateError } = await supabase.rpc("increment_likes_count", { post_id: postId })

        if (updateError) {
          const { data: currentPost } = await supabase.from("posts").select("likes_count").eq("id", postId).single()

          await supabase
            .from("posts")
            .update({ likes_count: (currentPost?.likes_count || 0) + 1 })
            .eq("id", postId)
        }

        if (creatorId && creatorId !== currentUserId) {
          fetch("/api/notifications/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: creatorId,
              actorId: currentUserId,
              type: "new_like",
              metadata: { postId },
            }),
          }).catch((e) => console.error("[v0] Notification error:", e))
        }
      } else {
        const { error: deleteError } = await supabase.from("likes").delete().match({
          user_id: currentUserId,
          post_id: postId,
        })

        if (deleteError) throw deleteError

        const { error: updateError } = await supabase.rpc("decrement_likes_count", { post_id: postId })

        if (updateError) {
          const { data: currentPost } = await supabase.from("posts").select("likes_count").eq("id", postId).single()

          await supabase
            .from("posts")
            .update({ likes_count: Math.max(0, (currentPost?.likes_count || 0) - 1) })
            .eq("id", postId)
        }
      }

      console.log("[v0] Like toggled successfully:", { postId, liked: newLiked })

      return true
    } catch (error) {
      console.error("[v0] Like error:", error)
      setLiked(previousLiked)
      setLikesCount(previousCount)
      return false
    }
  }, [postId, currentUserId, liked, likesCount, creatorId])

  const handleFavorite = useCallback(async () => {
    if (!currentUserId) return false

    const previousFavorited = favorited

    setFavorited(!favorited)

    try {
      if (!favorited) {
        const { error } = await supabase.from("post_favorites").insert({
          user_id: currentUserId,
          post_id: postId,
        })

        if (error) throw error
      } else {
        const { error } = await supabase.from("post_favorites").delete().match({
          user_id: currentUserId,
          post_id: postId,
        })

        if (error) throw error
      }

      console.log("[v0] Favorite toggled successfully:", { postId, favorited: !previousFavorited })

      router.refresh()

      return true
    } catch (error) {
      console.error("[v0] Favorite error:", error)
      setFavorited(previousFavorited)
      return false
    }
  }, [postId, currentUserId, favorited, router])

  const handleShare = useCallback(
    async (destination?: string) => {
      if (!currentUserId) return false

      setSharesCount((prev) => prev + 1)

      try {
        await supabase.from("post_shares").insert({
          user_id: currentUserId,
          post_id: postId,
        })

        if (destination) {
          await fetch("/api/posts/track-share", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId, destination }),
          })
        }

        // Update post shares_count
        await supabase
          .from("posts")
          .update({ shares_count: sharesCount + 1 })
          .eq("id", postId)

        if (creatorId && creatorId !== currentUserId) {
          fetch("/api/notifications/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: creatorId,
              actorId: currentUserId,
              type: "new_share",
              metadata: { postId, destination },
            }),
          }).catch((e) => console.error("[v0] Notification error:", e))
        }

        console.log("[v0] Share tracked successfully:", { postId, destination })

        router.refresh()

        return true
      } catch (error) {
        console.error("[v0] Share error:", error)
        setSharesCount((prev) => Math.max(0, prev - 1))
        return false
      }
    },
    [postId, currentUserId, sharesCount, router, creatorId],
  )

  const handleComment = useCallback(
    async (content: string) => {
      if (!currentUserId || !content.trim()) return false

      try {
        const { error } = await supabase.from("comments").insert({
          post_id: postId,
          user_id: currentUserId,
          content: content.trim(),
        })

        if (error) throw error

        // Update comments count
        setCommentsCount((prev) => prev + 1)

        // Update post comments_count
        await supabase
          .from("posts")
          .update({ comments_count: commentsCount + 1 })
          .eq("id", postId)

        if (creatorId && creatorId !== currentUserId) {
          fetch("/api/notifications/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: creatorId,
              actorId: currentUserId,
              type: "new_comment",
              metadata: { postId, content: content.substring(0, 50) },
            }),
          }).catch((e) => console.error("[v0] Notification error:", e))
        }

        console.log("[v0] Comment posted successfully:", { postId })

        router.refresh()

        return true
      } catch (error) {
        console.error("[v0] Comment error:", error)
        return false
      }
    },
    [postId, currentUserId, commentsCount, router, creatorId],
  )

  return {
    liked,
    favorited,
    likesCount,
    commentsCount,
    sharesCount,
    loading,
    handleLike,
    handleFavorite,
    handleShare,
    handleComment,
  }
}
