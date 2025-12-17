"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

interface UseFollowOptions {
  userId: string
  currentUserId: string | null
  initialIsFollowing?: boolean
}

export function useFollow({ userId, currentUserId, initialIsFollowing = false }: UseFollowOptions) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    if (!currentUserId || userId === currentUserId) {
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
  }, [userId, currentUserId])

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

      console.log("[v0] Follow toggled successfully:", { userId, isFollowing: !previousState })
      return true
    } catch (error) {
      console.error("[v0] Follow error:", error)
      // Rollback on error
      setIsFollowing(previousState)
      return false
    }
  }, [userId, currentUserId, isFollowing])

  return {
    isFollowing,
    loading,
    toggleFollow,
  }
}
