"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface UseFollowOptions {
  userId: string
  currentUserId: string | null
  initialIsFollowing?: boolean
  skipFetch?: boolean
}

export function useFollow({ userId, currentUserId, initialIsFollowing = false, skipFetch = false }: UseFollowOptions) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(!skipFetch)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!currentUserId || userId === currentUserId || skipFetch) {
      setLoading(false)
      return
    }

    const fetchFollowState = async () => {
      try {
        const { data } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", currentUserId)
          .eq("following_id", userId)
          .maybeSingle()

        console.log("[v0] Follow state fetched:", { userId, isFollowing: !!data })
        setIsFollowing(!!data)
      } catch (error) {
        console.error("[v0] Error fetching follow state:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFollowState()
  }, [userId, currentUserId, skipFetch])

  const toggleFollow = useCallback(async () => {
    if (!currentUserId || userId === currentUserId) return false

    const previousState = isFollowing

    // Optimistic update
    setIsFollowing(!isFollowing)

    try {
      const response = await fetch("/api/follow", {
        method: isFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: userId }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle follow")
      }

      if (!isFollowing && userId !== currentUserId) {
        fetch("/api/notifications/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId, // Following user
            actorId: currentUserId, // Current user
            type: "new_follower",
            metadata: {},
          }),
        }).catch((e) => console.error("[v0] Notification error:", e))
      }

      console.log("[v0] Follow toggled successfully:", { userId, isFollowing: !previousState })

      router.refresh()

      return true
    } catch (error) {
      console.error("[v0] Follow error:", error)
      // Rollback on error
      setIsFollowing(previousState)
      return false
    }
  }, [userId, currentUserId, isFollowing, router])

  return {
    isFollowing,
    loading,
    toggleFollow,
  }
}
