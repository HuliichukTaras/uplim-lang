"use client"

import type React from "react"
import { Link } from "@/i18n/navigation" // Added Link import
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { X, Lock, AlertCircle, VideoIcon, ImageIcon, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UnlockModal } from "@/components/modals/unlock-modal"
import { AgeVerificationModal } from "@/components/age-verification-modal"
import { ShareModal } from "@/components/interaction/share-modal"
import { cn } from "@/lib/utils"
import { HeartIcon, CommentIcon } from "@/components/flaticon-icons"
import { StarIcon, ShareIcon } from "@/components/flaticon-icons"
import { DynamicGradientOverlay } from "@/components/dynamic-gradient-overlay"
import { usePostInteractions } from "@/hooks/usePostInteractions"

interface Comment {
  id: string
  content: string
  created_at: string
  profiles: {
    display_name: string | null
    username: string | null
  }
}

type PostWithAuthor = {
  id: string
  media_urls: string[]
  video_url?: string | null
  caption?: string | null
  tags: string[]
  price: number
  user_id: string
  is_nsfw?: boolean
  is_paid?: boolean
  curiosity_unlock?: boolean
  blur_level?: number | null
  blur_required?: boolean
  likes_count?: number
  comments_count?: number
  shares_count?: number
  profiles: {
    display_name: string | null
    username: string | null
    avatar_url?: string | null
  }
}

type PostModalProps = {
  post: PostWithAuthor
  currentUserId: string | null
  isAgeVerified?: boolean
  isAuthenticated?: boolean
  hasPaymentCard?: boolean
  onClose: () => void
  onUpdate: () => void
}

export function PostModal({
  post,
  currentUserId,
  isAgeVerified = false,
  isAuthenticated = false,
  hasPaymentCard = false,
  onClose,
  onUpdate,
}: PostModalProps) {
  const { liked, favorited, likesCount, commentsCount, handleLike, handleFavorite } = usePostInteractions({
    postId: post.id,
    currentUserId,
    creatorId: post.user_id,
    initialLikes: post.likes_count || 0,
    initialComments: post.comments_count || 0,
    initialShares: post.shares_count || 0,
    skipFetch: false,
  })

  const [isUnlocked, setIsUnlocked] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)
  const [showAgeModal, setShowAgeModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showVideo, setShowVideo] = useState(!!post.video_url)
  const supabase = createClient()

  useEffect(() => {
    checkUnlockStatus()
    fetchComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id, currentUserId, isAgeVerified, hasPaymentCard, isAuthenticated])

  const checkUnlockStatus = async () => {
    if (!currentUserId) {
      setIsUnlocked(!post.is_paid && !post.is_nsfw && !post.curiosity_unlock)
      return
    }

    if (post.is_nsfw && !isAgeVerified) {
      setIsUnlocked(false)
      return
    }

    if (post.is_nsfw && !hasPaymentCard) {
      setIsUnlocked(false)
      return
    }

    if (!post.is_paid && !post.is_nsfw) {
      setIsUnlocked(true)
      return
    }

    if (post.user_id === currentUserId) {
      setIsUnlocked(true)
      return
    }

    // Check subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("subscriber_id", currentUserId)
      .eq("creator_id", post.user_id)
      .eq("status", "active")
      .single()

    if (subscription) {
      setIsUnlocked(true)
      return
    }

    // Check paid unlock
    if (post.is_paid) {
      const { data } = await supabase
        .from("post_unlocks")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", currentUserId)
        .single()
      setIsUnlocked(!!data)
      return
    }

    // NSFW content with age verification
    if (post.is_nsfw && isAgeVerified) {
      setIsUnlocked(true)
    }
  }

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select(`
        *,
        profiles:user_id (
          display_name,
          username
        )
      `)
      .eq("post_id", post.id)
      .order("created_at", { ascending: true })

    if (data) {
      setComments(data as Comment[])
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !currentUserId || !isAuthenticated) return

    await supabase.from("comments").insert({
      post_id: post.id,
      user_id: currentUserId,
      content: newComment,
    })

    if (post.user_id !== currentUserId) {
      fetch("/api/notifications/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: post.user_id,
          actorId: currentUserId,
          type: "new_comment",
          metadata: { postId: post.id, content: newComment.substring(0, 50) },
        }),
      })
    }

    setNewComment("")
    fetchComments()
    onUpdate()
  }

  const handleUnlockSuccess = () => {
    setShowUnlockDialog(false)
    setIsUnlocked(true)
    onUpdate()
  }

  const handleAgeVerified = () => {
    setShowAgeModal(false)
    setIsUnlocked(true)
  }

  const handleShare = () => {
    setShowShareModal(true)
  }

  const getBlurClass = () => {
    if (!shouldBlur) return ""
    switch (post.blur_level) {
      case 0:
        return ""
      case 1:
        return "blur-md"
      case 2:
        return "blur-xl"
      case 3:
        return "blur-3xl"
      default:
        return "blur-xl"
    }
  }

  const shouldBlur = (post.is_nsfw || post.is_paid) && !isUnlocked

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-3xl overflow-hidden neuro-raised flex">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="flex-1 bg-black flex items-center justify-center relative">
            {showVideo && post.video_url ? (
              <>
                {console.log("[v0] Modal rendering video:", post.video_url)}
                <video
                  src={post.video_url}
                  className={cn("max-w-full max-h-full")}
                  controls
                  autoPlay
                  onError={(e) => {
                    console.error("[v0] Modal video error:", e.currentTarget.error)
                  }}
                  onLoadedMetadata={() => console.log("[v0] Modal video metadata loaded")}
                  onCanPlay={() => console.log("[v0] Modal video can play")}
                />
              </>
            ) : (
              <img
                src={post.media_urls[currentImageIndex] || "/placeholder.svg"}
                alt="Post"
                className={cn("max-w-full max-h-full object-contain")}
              />
            )}

            {shouldBlur && (
              <>
                <DynamicGradientOverlay />
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/30 via-black/20 to-black/30 backdrop-blur-sm">
                  <div className="text-center text-white p-8 rounded-2xl bg-black/40 backdrop-blur-md">
                    {post.is_nsfw && !isAgeVerified ? (
                      <>
                        <AlertCircle className="h-16 w-16 mx-auto mb-4" />
                        <p className="text-2xl font-bold mb-2">Age Verification Required</p>
                        <p className="text-sm mb-4">You must be 18+ to view this content</p>
                        <Button className="glow-border-cyan" onClick={() => setShowAgeModal(true)}>
                          Verify Age
                        </Button>
                      </>
                    ) : (
                      <>
                        <Lock className="h-16 w-16 mx-auto mb-4" />
                        {post.is_paid && (
                          <>
                            <p className="text-2xl font-bold mb-2">${post.price}</p>
                            <Button className="glow-border-cyan" onClick={() => setShowUnlockDialog(true)}>
                              Unlock Post
                            </Button>
                          </>
                        )}
                        {post.is_nsfw && !post.is_paid && <p className="text-lg">18+ Content</p>}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {post.video_url && post.media_urls.length > 0 && (
              <div className="absolute top-4 left-4 flex gap-2">
                <Button
                  size="sm"
                  variant={showVideo ? "default" : "outline"}
                  onClick={() => setShowVideo(true)}
                  className="bg-white/90"
                >
                  <VideoIcon className="h-4 w-4 mr-1" />
                  Video
                </Button>
                <Button
                  size="sm"
                  variant={!showVideo ? "default" : "outline"}
                  onClick={() => setShowVideo(false)}
                  className="bg-white/90"
                >
                  <ImageIcon className="h-4 w-4 mr-1" />
                  Images ({post.media_urls.length})
                </Button>
              </div>
            )}

            {/* Image navigation */}
            {!showVideo && post.media_urls.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {post.media_urls.map((_mediaUrl: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      index === currentImageIndex ? "bg-white w-8" : "bg-white/50",
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info section */}
          <div className="w-96 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#a855f7]" />
                <div>
                  <p className="font-semibold">{post.profiles.display_name || post.profiles.username || "User"}</p>
                  {post.is_nsfw && <span className="text-xs text-red-500 font-semibold">18+</span>}
                </div>
              </div>
              {post.caption && <p className="mt-3 text-sm text-gray-700">{post.caption}</p>}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {post.tags.map((tag: string) => (
                    <Link
                      key={tag}
                      href={`/discover?tag=${tag}`}
                      className="px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Comments */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#38bdf8] to-[#ec4899] flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">
                      {comment.profiles.display_name || comment.profiles.username || "User"}
                    </p>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <button onClick={handleLike} className="transition-transform hover:scale-110">
                  <HeartIcon className={cn("h-6 w-6", liked ? "text-red-500" : "text-gray-700")} filled={liked} />
                </button>
                <CommentIcon className="h-6 w-6 text-gray-700" />
                <button onClick={handleShare} className="transition-transform hover:scale-110">
                  <ShareIcon className="h-6 w-6 text-gray-700" />
                </button>
                <button onClick={handleFavorite} className="ml-auto transition-transform hover:scale-110">
                  <StarIcon
                    className={cn("h-6 w-6", favorited ? "text-yellow-500" : "text-gray-700")}
                    filled={favorited}
                  />
                </button>
              </div>
              <p className="text-sm font-semibold mb-4">
                {likesCount} {likesCount === 1 ? "like" : "likes"}
              </p>

              {/* Comment input */}
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="neuro-inset"
                />
                <Button type="submit" size="icon" className="glow-border-cyan">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>

        <UnlockModal
          isOpen={showUnlockDialog}
          onClose={() => setShowUnlockDialog(false)}
          postId={post.id}
          creatorId={post.user_id}
          price={post.price}
          onUnlock={handleUnlockSuccess}
        />
      </div>

      <AgeVerificationModal
        isOpen={showAgeModal}
        onClose={() => setShowAgeModal(false)}
        onVerified={handleAgeVerified}
      />

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          postId={post.id}
          postUrl={`${window.location.origin}/post/${post.id}`}
        />
      )}
    </>
  )
}
