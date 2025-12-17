"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Link } from "@/i18n/navigation"
import { TrendingUp, Eye } from "lucide-react"
import { HeartIcon, CommentIcon, StarIcon, ShareIcon } from "@/components/flaticon-icons"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { UnlockModal } from "@/components/modals/unlock-modal"
import { ShareModal } from "@/components/interaction/share-modal"
import { usePostInteractions } from "@/hooks/usePostInteractions"
import { useFollow } from "@/hooks/useFollow"
import { LockedContentOverlay } from "@/components/locked-content-overlay"
import { DynamicGradientOverlay } from "@/components/dynamic-gradient-overlay"

const AVATAR_GRADIENT = "from-primary to-secondary"
const RING_STYLE = "ring-2 ring-transparent group-hover:ring-primary/20 transition-all"
const MAX_CAPTION_LENGTH = 1500
const TRUNCATE_PREVIEW_LENGTH = 150

interface PostCardProps {
  post: any
  isUnlocked?: boolean
  currentUserId?: string | null
  onUnlockClick?: () => void
  priority?: boolean
  initialLiked?: boolean
  initialIsFollowing?: boolean
}

export function PostCard({
  post,
  isUnlocked: externalIsUnlocked,
  currentUserId,
  onUnlockClick,
  initialLiked = false,
  initialIsFollowing = false,
  priority = false,
}: PostCardProps) {
  const shouldUseInitialInteraction = initialLiked !== undefined
  const shouldUseInitialFollow = initialIsFollowing !== undefined

  const {
    liked,
    favorited,
    likesCount,
    commentsCount,
    sharesCount,
    loading: interactionsLoading,
    handleLike,
    handleFavorite,
    handleShare,
    handleComment: submitComment,
  } = usePostInteractions({
    postId: post.id,
    currentUserId,
    creatorId: post.user_id,
    initialLikes: post.likes_count || 0,
    initialComments: post.comments_count || 0,
    initialShares: post.shares_count || 0,
    initialLiked: initialLiked || false,
    initialFavorited: false,
    skipFetch: shouldUseInitialInteraction,
  })

  const { isFollowing, toggleFollow } = useFollow({
    userId: post.user_id,
    currentUserId,
    initialIsFollowing: initialIsFollowing || false,
    skipFetch: shouldUseInitialFollow,
  })

  const [showNSFW, setShowNSFW] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasViewed, setHasViewed] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const supabase = createClient()
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)
  const [showCopyrightModal, setShowCopyrightModal] = useState(false)
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false)

  useEffect(() => {
    if (hasViewed || !cardRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasViewed) {
            setHasViewed(true)
            trackView()

            if (post.isPromoted && post.promotionId) {
              trackPromotionImpression()
            }
          }
        })
      },
      { threshold: 0.5 },
    )

    observer.observe(cardRef.current)

    return () => observer.disconnect()
  }, [hasViewed, post.isPromoted, post.promotionId])

  useEffect(() => {
    if (!videoRef.current || !post.video_url) return

    console.log("[v0] Video URL:", post.video_url)
    console.log("[v0] Thumbnail:", post.thumbnail_url || post.media_urls?.[0])

    const videoElement = videoRef.current

    const handleLoadStart = () => console.log("[v0] Video load started")
    const handleLoadedMetadata = () => console.log("[v0] Video metadata loaded")
    const handleLoadedData = () => console.log("[v0] Video data loaded")
    const handleCanPlay = () => console.log("[v0] Video can play")
    const handleError = (e: Event) => {
      const target = e.target as HTMLVideoElement
      console.error("[v0] Video error:", target.error)
    }

    videoElement.addEventListener("loadstart", handleLoadStart)
    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata)
    videoElement.addEventListener("loadeddata", handleLoadedData)
    videoElement.addEventListener("canplay", handleCanPlay)
    videoElement.addEventListener("error", handleError)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch((err) => {
              console.error("[v0] Video play failed:", err)
            })
          } else {
            videoRef.current?.pause()
          }
        })
      },
      { threshold: 0.6 },
    )

    observer.observe(videoRef.current)

    return () => {
      videoElement.removeEventListener("loadstart", handleLoadStart)
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata)
      videoElement.removeEventListener("loadeddata", handleLoadedData)
      videoElement.removeEventListener("canplay", handleCanPlay)
      videoElement.removeEventListener("error", handleError)
      observer.disconnect()
    }
  }, [post.video_url, post.thumbnail_url, post.media_urls])

  const handleVideoMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }

  const handleVideoMouseLeave = () => {}

  const trackView = async () => {
    try {
      await fetch("/api/posts/track-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      })
    } catch (error) {
      console.log("[v0] View tracking unavailable")
    }
  }

  const trackPromotionImpression = async () => {
    try {
      await fetch("/api/promotions/track-impression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promotionId: post.promotionId,
          sessionId: sessionStorage.getItem("sessionId") || Math.random().toString(36),
        }),
      })
    } catch (error) {
      console.log("[v0] Promotion tracking unavailable")
    }
  }

  const loadComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(display_name, handle, avatar_url)")
      .eq("post_id", post.id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (data) setComments(data)
  }

  const handleCommentClick = () => {
    if (!currentUserId) return
    setShowComments(true)
    loadComments()
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting || !currentUserId) return

    setIsSubmitting(true)
    try {
      const success = await submitComment(newComment)
      if (success) {
        setNewComment("")
        loadComments()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const needsUnlock = post.is_nsfw || post.is_paid || post.is_adult
  const isUnlocked = externalIsUnlocked || !needsUnlock || post.profiles?.id === currentUserId

  const shouldBlur = needsUnlock && !isUnlocked
  const shouldLock = needsUnlock && !isUnlocked
  const displayPrice = post.price || 1.5

  const renderLockedOverlay = () => {
    if (!shouldLock) return null

    return (
      <>
        <DynamicGradientOverlay />
        <LockedContentOverlay
          price={displayPrice}
          isAdult={post.is_adult || post.is_nsfw}
          onUnlock={() => setShowUnlockDialog(true)}
        />
      </>
    )
  }

  const getTimeAgo = (date: string) => {
    const now = new Date()
    const postDate = new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`
    return `${Math.floor(diffInSeconds / 604800)}w`
  }

  const postUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/post/${post.id}`

  return (
    <>
      <article ref={cardRef} className="bg-white border-b border-gray-100 pb-4 max-w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href={`/${post.profiles.handle}`}>
              <div className={cn("w-10 h-10 rounded-full p-[2px] bg-background", RING_STYLE)}>
                <div className="w-full h-full rounded-full overflow-hidden bg-muted">
                  {post.profiles.avatar_url ? (
                    <Image
                      src={post.profiles.avatar_url || "/placeholder.svg"}
                      alt={post.profiles.display_name}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div
                      className={cn(
                        "w-full h-full flex items-center justify-center bg-gradient-to-br",
                        AVATAR_GRADIENT,
                      )}
                    >
                      <span className="text-white font-semibold text-xs">
                        {post.profiles.display_name?.[0]?.toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Link href={`/${post.profiles.handle}`}>
                  <span className="font-semibold text-sm text-foreground hover:text-primary transition-colors">
                    {post.profiles.display_name || post.profiles.handle}
                  </span>
                </Link>

                {post.isPromoted && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 rounded-full">
                    <TrendingUp className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-bold text-primary uppercase">Ad</span>
                  </div>
                )}
              </div>
              <div className="flex items-center text-xs text-muted-foreground gap-1">
                <span>{getTimeAgo(post.created_at)}</span>
                {currentUserId && currentUserId !== post.user_id && (
                  <>
                    <span>•</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleFollow()
                      }}
                      className={cn(
                        "font-semibold transition-colors",
                        isFollowing
                          ? "text-muted-foreground hover:text-destructive"
                          : "text-primary hover:text-primary/80",
                      )}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Media Content */}
        <div className="relative w-full aspect-square bg-muted overflow-hidden">
          {post.video_url ? (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                src={post.video_url}
                playsInline
                muted
                loop
                preload="metadata"
                poster={post.thumbnail_url || post.media_urls?.[0]}
                controls={!shouldBlur}
                onMouseEnter={handleVideoMouseEnter}
                className={cn(
                  "w-full h-full transition-all duration-500",
                  shouldBlur ? "object-cover scale-105" : "object-contain",
                )}
              />
              {renderLockedOverlay()}
            </div>
          ) : post.media_urls && post.media_urls.length > 0 ? (
            <div className="relative w-full h-full">
              <Image
                src={post.media_urls[0] || "/placeholder.svg"}
                alt={post.caption || "Post image"}
                fill
                className={cn("transition-all duration-500", shouldBlur ? "object-cover scale-105" : "object-contain")}
                priority={priority}
              />
              {post.media_urls.length > 1 && (
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full z-10">
                  <span className="text-white text-xs font-bold tracking-wider">1 / {post.media_urls.length}</span>
                </div>
              )}
              {renderLockedOverlay()}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <p className="text-muted-foreground text-sm">No media available</p>
            </div>
          )}
        </div>

        {/* Actions & Info */}
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-5">
              <button
                onClick={handleLike}
                className="transition-transform active:scale-95 hover:opacity-80"
                aria-label="Like"
              >
                <HeartIcon
                  className={cn("w-7 h-7 transition-colors", liked ? "text-red-500" : "text-foreground")}
                  filled={liked}
                />
              </button>
              <button
                onClick={handleCommentClick}
                className="transition-transform active:scale-95 hover:opacity-80"
                aria-label="Comment"
              >
                <CommentIcon className="w-7 h-7 text-foreground transition-colors" />
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="transition-transform active:scale-95 hover:opacity-80"
                aria-label="Share"
              >
                <ShareIcon className="w-7 h-7 text-foreground transition-colors" />
              </button>
            </div>
            <button
              onClick={handleFavorite}
              className="transition-transform active:scale-95 hover:opacity-80"
              aria-label="Save"
            >
              <StarIcon
                className={cn("w-7 h-7 transition-colors", favorited ? "text-amber-500" : "text-foreground")}
                filled={favorited}
              />
            </button>
          </div>

          {/* Media dots indicator */}
          {post.media_urls && post.media_urls.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mb-4">
              {post.media_urls.map((_mediaUrl: string, index: number) => (
                <div
                  key={index}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    index === 0 ? "bg-primary w-2 h-2" : "bg-muted-foreground/30",
                  )}
                />
              ))}
            </div>
          )}

          {/* Likes count */}
          {likesCount > 0 && (
            <div className="mb-2">
              <button className="font-semibold text-sm text-foreground hover:text-muted-foreground transition-colors">
                {likesCount.toLocaleString()} {likesCount === 1 ? "like" : "likes"}
              </button>
            </div>
          )}

          {post.views_count > 0 && (
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span>
                {post.views_count.toLocaleString()} {post.views_count === 1 ? "view" : "views"}
              </span>
            </div>
          )}

          {/* Caption */}
          {post.caption && (
            <div className="mb-2">
              <p className="text-sm leading-relaxed">
                <Link href={`/${post.profiles.handle}`}>
                  <span className="font-semibold text-foreground mr-2 hover:underline">
                    {post.profiles.display_name || post.profiles.handle}
                  </span>
                </Link>
                {(() => {
                  const captionWithoutHashtags = post.caption.replace(/#\w+/g, "").trim()
                  const caption =
                    captionWithoutHashtags.length > MAX_CAPTION_LENGTH
                      ? captionWithoutHashtags.slice(0, MAX_CAPTION_LENGTH) + "..."
                      : captionWithoutHashtags
                  const shouldTruncate = caption.length > TRUNCATE_PREVIEW_LENGTH
                  const displayText =
                    shouldTruncate && !isCaptionExpanded
                      ? caption.slice(0, TRUNCATE_PREVIEW_LENGTH).trimEnd() + "..."
                      : caption

                  return (
                    <>
                      <span className="text-foreground whitespace-pre-wrap">{displayText}</span>
                      {shouldTruncate && (
                        <button
                          onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
                          className="text-muted-foreground hover:text-foreground ml-1 font-medium transition-colors"
                        >
                          {isCaptionExpanded ? "less" : "more"}
                        </button>
                      )}
                    </>
                  )
                })()}
              </p>
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.tags.map((tag: string) => (
                <Link
                  key={tag}
                  href={`/discover?tag=${tag}`}
                  className="text-xs font-medium text-primary hover:text-primary/80 hover:underline"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Comments link */}
          {commentsCount > 0 && (
            <button
              onClick={handleCommentClick}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 block"
            >
              View all {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
            </button>
          )}

          {/* Add comment */}
          <div className="flex items-center gap-3 pt-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
              {post.profiles.avatar_url ? (
                <Image
                  src={post.profiles.avatar_url || "/placeholder.svg"}
                  alt="Your avatar"
                  width={24}
                  height={24}
                  className="rounded-full object-cover w-full h-full"
                />
              ) : (
                <div
                  className={cn("w-full h-full flex items-center justify-center bg-gradient-to-br", AVATAR_GRADIENT)}
                >
                  <span className="text-white font-semibold text-[10px]">U</span>
                </div>
              )}
            </div>
            <button
              onClick={handleCommentClick}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-left"
            >
              Add a comment...
            </button>
          </div>
        </div>
      </article>

      {/* Comments Dialog */}
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

            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    {comment.profiles?.avatar_url ? (
                      <Image
                        src={comment.profiles.avatar_url || "/placeholder.svg"}
                        alt={comment.profiles.display_name || "User"}
                        width={32}
                        height={32}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div
                        className={cn(
                          "w-full h-full flex items-center justify-center bg-gradient-to-br",
                          AVATAR_GRADIENT,
                        )}
                      >
                        <span className="text-white font-semibold text-xs">
                          {comment.profiles?.display_name?.[0]?.toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold mr-2">
                        {comment.profiles?.display_name || comment.profiles?.handle || "User"}
                      </span>
                      {comment.content}
                    </p>
                    <span className="text-xs text-muted-foreground">{getTimeAgo(comment.created_at)}</span>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No comments yet. Be the first!</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        postId={post.id}
        postUrl={postUrl}
        postTitle={post.caption || "Check out this post"}
      />

      {/* Unlock Modal */}
      <UnlockModal
        isOpen={showUnlockDialog}
        onClose={() => setShowUnlockDialog(false)}
        postId={post.id}
        creatorId={post.user_id}
        price={displayPrice}
        onUnlock={() => {
          setShowUnlockDialog(false)
          window.location.reload()
        }}
      />
    </>
  )
}
