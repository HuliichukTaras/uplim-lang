"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { HeartIcon, CommentIcon, StarIcon, ShareIcon } from "@/components/flaticon-icons"
import { ShareModal } from "@/components/interaction/share-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface FanticxInteractionBarProps {
  postId: string
  initialLikes: number
  initialComments: number
  initialShares: number
  currentUserId: string | null
  isAuthenticated: boolean
  onLoginRequired?: () => void
  compact?: boolean
}

export function FanticxInteractionBar({
  postId,
  initialLikes,
  initialComments,
  initialShares,
  currentUserId,
  isAuthenticated,
  onLoginRequired,
  compact = false,
}: FanticxInteractionBarProps) {
  const [liked, setLiked] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [likesCount, setLikesCount] = useState(initialLikes)
  const [commentsCount, setCommentsCount] = useState(initialComments)
  const [sharesCount, setSharesCount] = useState(initialShares)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const postUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/post/${postId}`

  useEffect(() => {
    if (!currentUserId) return

    const checkStatus = async () => {
      const [likeCheck, favCheck] = await Promise.all([
        supabase.from("likes").select("id").eq("post_id", postId).eq("user_id", currentUserId).single(),
        supabase.from("post_favorites").select("id").eq("post_id", postId).eq("user_id", currentUserId).single(),
      ])

      setLiked(!!likeCheck.data)
      setFavorited(!!favCheck.data)
    }

    checkStatus()
  }, [postId, currentUserId, supabase])

  useEffect(() => {
    setLikesCount(initialLikes)
    setCommentsCount(initialComments)
    setSharesCount(initialShares)
  }, [initialLikes, initialComments, initialShares])

  const handleLike = async () => {
    if (!isAuthenticated || !currentUserId) {
      onLoginRequired?.()
      return
    }

    const previousLiked = liked
    const previousCount = likesCount

    const newLiked = !liked
    setLiked(newLiked)
    setLikesCount((prev) => (newLiked ? prev + 1 : Math.max(0, prev - 1)))

    try {
      if (newLiked) {
        const { error: insertError } = await supabase.from("likes").insert({ user_id: currentUserId, post_id: postId })
        if (insertError) throw insertError

        const { data: currentPost } = await supabase.from("posts").select("likes_count").eq("id", postId).single()

        const newCount = (currentPost?.likes_count || 0) + 1
        await supabase.from("posts").update({ likes_count: newCount }).eq("id", postId)

        setLikesCount(newCount)
      } else {
        const { error: deleteError } = await supabase
          .from("likes")
          .delete()
          .match({ user_id: currentUserId, post_id: postId })
        if (deleteError) throw deleteError

        const { data: currentPost } = await supabase.from("posts").select("likes_count").eq("id", postId).single()

        const newCount = Math.max(0, (currentPost?.likes_count || 0) - 1)
        await supabase.from("posts").update({ likes_count: newCount }).eq("id", postId)

        setLikesCount(newCount)
      }
    } catch (error) {
      console.error("[v0] Like error:", error)
      setLiked(previousLiked)
      setLikesCount(previousCount)
    }
  }

  const handleFavorite = async () => {
    if (!isAuthenticated || !currentUserId) {
      onLoginRequired?.()
      return
    }

    const newFavorited = !favorited
    setFavorited(newFavorited)

    try {
      if (newFavorited) {
        await supabase.from("post_favorites").insert({ user_id: currentUserId, post_id: postId })
      } else {
        await supabase.from("post_favorites").delete().match({ user_id: currentUserId, post_id: postId })
      }
    } catch (error) {
      setFavorited(!newFavorited)
    }
  }

  const handleShare = async (destination: string) => {
    if (!isAuthenticated || !currentUserId) {
      onLoginRequired?.()
      return
    }

    setSharesCount((prev) => prev + 1)

    try {
      await supabase.from("post_shares").insert({
        user_id: currentUserId,
        post_id: postId,
      })

      await fetch("/api/posts/track-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, destination }),
      })
    } catch (error) {
      console.error("Share error:", error)
    }
  }

  const loadComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(display_name, handle, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: false })
      .limit(20)

    if (data) setComments(data)
  }

  const handleCommentClick = () => {
    if (!isAuthenticated || !currentUserId) {
      onLoginRequired?.()
      return
    }
    setShowComments(true)
    loadComments()
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting || !currentUserId) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: currentUserId,
        content: newComment.trim(),
      })

      if (!error) {
        setNewComment("")
        setCommentsCount((prev) => prev + 1)
        loadComments()
      }
    } catch (error) {
      console.error("Comment error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-white">
        <button onClick={handleLike} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
          <HeartIcon className="w-5 h-5" filled={liked} />
          <span className="text-sm font-semibold">{likesCount}</span>
        </button>
        {commentsCount > 0 && (
          <button
            onClick={handleCommentClick}
            className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
          >
            <CommentIcon className="w-5 h-5" />
            <span className="text-sm font-semibold">{commentsCount}</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between px-3 pt-2">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className="hover:opacity-50 transition-opacity active:scale-90"
            aria-label="Like"
          >
            <HeartIcon className={cn("w-7 h-7 transition-all", liked ? "text-red-500" : "text-black")} filled={liked} />
          </button>
          <button
            onClick={handleCommentClick}
            className="hover:opacity-50 transition-opacity active:scale-90"
            aria-label="Comment"
          >
            <CommentIcon className="w-7 h-7 text-black" />
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="hover:opacity-50 transition-opacity active:scale-90"
            aria-label="Share"
          >
            <ShareIcon className="w-7 h-7 text-black" />
          </button>
        </div>
        <button
          onClick={handleFavorite}
          className="hover:opacity-50 transition-opacity active:scale-90"
          aria-label="Save to favorites"
        >
          <StarIcon
            className={cn("w-7 h-7 transition-all", favorited ? "text-yellow-500" : "text-black")}
            filled={favorited}
          />
        </button>
      </div>

      <div className="px-3 mt-2 space-y-1 text-sm">
        {likesCount > 0 && (
          <button className="font-semibold text-black hover:text-gray-600">
            {likesCount.toLocaleString()} {likesCount === 1 ? "like" : "likes"}
          </button>
        )}
        {commentsCount > 0 && (
          <button onClick={handleCommentClick} className="block text-gray-500 hover:text-gray-700">
            View all {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
          </button>
        )}
        {sharesCount > 0 && (
          <p className="text-gray-500">
            {sharesCount.toLocaleString()} {sharesCount === 1 ? "share" : "shares"}
          </p>
        )}
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        postId={postId}
        postUrl={postUrl}
        onShare={handleShare}
      />

      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1"
                rows={2}
              />
              <Button onClick={handleSubmitComment} disabled={isSubmitting || !newComment.trim()}>
                Post
              </Button>
            </div>

            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No comments yet. Be the first!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#a855f7] flex items-center justify-center flex-shrink-0">
                      {comment.profiles?.avatar_url ? (
                        <Image
                          src={comment.profiles.avatar_url || "/placeholder.svg"}
                          alt={comment.profiles.display_name}
                          width={32}
                          height={32}
                          className="rounded-full object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-white text-xs font-semibold">
                          {comment.profiles?.display_name?.[0]?.toUpperCase() || "U"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <p className="font-semibold text-sm text-gray-900">
                          {comment.profiles?.display_name || "User"}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(comment.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
