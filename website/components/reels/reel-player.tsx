"use client"

import { useRef, useEffect, useState } from "react"
import { HeartIcon, CommentIcon, ShareIcon, StarIcon } from "@/components/flaticon-icons"
import { MoreVertical, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Link } from "@/i18n/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { ShareModal } from "@/components/interaction/share-modal"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { PostOptionsMenu } from "@/components/interaction/post-options-menu"

interface Reel {
  id: string
  caption: string
  video_url: string
  media_urls: string[]
  likes_count: number
  comments_count: number
  views_count: number
  user_id: string
  profiles: {
    id: string
    handle: string
    display_name: string
    avatar_url: string
  }
}

export function ReelPlayer({ reel, isActive, userId }: { reel: Reel; isActive: boolean; userId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [likesCount, setLikesCount] = useState(reel.likes_count)
  const [commentsCount, setCommentsCount] = useState(reel.comments_count)
  const [isMuted, setIsMuted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const videoUrl = reel.video_url || reel.media_urls?.[0]

  useEffect(() => {
    if (!videoRef.current) return

    if (isActive) {
      videoRef.current.play().catch(() => {
        // Autoplay failed, user needs to interact
      })
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }, [isActive])

  useEffect(() => {
    const checkLike = async () => {
      const { data } = await supabase.from("likes").select("id").eq("post_id", reel.id).eq("user_id", userId).single()
      setIsLiked(!!data)
    }

    const checkFavorite = async () => {
      const { data } = await supabase
        .from("post_favorites")
        .select("id")
        .eq("post_id", reel.id)
        .eq("user_id", userId)
        .maybeSingle()
      setIsFavorited(!!data)
    }

    checkLike()
    checkFavorite()
  }, [reel.id, userId])

  const handleLike = async () => {
    if (isLiked) {
      await supabase.from("likes").delete().eq("post_id", reel.id).eq("user_id", userId)
      setIsLiked(false)
      setLikesCount((prev) => prev - 1)
    } else {
      await supabase.from("likes").insert({ post_id: reel.id, user_id: userId })
      setIsLiked(true)
      setLikesCount((prev) => prev + 1)

      if (reel.user_id !== userId) {
        fetch("/api/notifications/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: reel.user_id,
            actorId: userId,
            type: "new_like",
            metadata: { postId: reel.id },
          }),
        })
      }
    }
  }

  const handleFavorite = async () => {
    if (isFavorited) {
      await supabase.from("post_favorites").delete().eq("post_id", reel.id).eq("user_id", userId)
      setIsFavorited(false)
    } else {
      await supabase.from("post_favorites").insert({ post_id: reel.id, user_id: userId })
      setIsFavorited(true)
    }
  }

  const handleShare = () => {
    setShowShareModal(true)
  }

  const loadComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(display_name, handle, avatar_url)")
      .eq("post_id", reel.id)
      .order("created_at", { ascending: false })
      .limit(20)

    if (data) setComments(data)
  }

  const handleComment = () => {
    setShowComments(true)
    loadComments()
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting || !userId) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("comments").insert({
        post_id: reel.id,
        user_id: userId,
        content: newComment.trim(),
      })

      if (!error) {
        if (reel.user_id !== userId) {
          fetch("/api/notifications/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: reel.user_id,
              actorId: userId,
              type: "new_comment",
              metadata: { postId: reel.id, content: newComment.trim().substring(0, 50) },
            }),
          })
        }

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

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        loop
        playsInline
        muted={isMuted}
        onClick={togglePlayPause}
      />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      <Button
        onClick={toggleMute}
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 pointer-events-auto"
      >
        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </Button>

      <div className="absolute right-4 bottom-24 flex flex-col gap-6 z-10 pointer-events-auto">
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
              isLiked ? "bg-red-500/20" : "bg-white/20 hover:bg-white/30",
            )}
          >
            <HeartIcon className={cn("h-6 w-6", isLiked ? "text-red-500" : "text-white")} filled={isLiked} />
          </div>
          <span className="text-white text-xs font-semibold">{likesCount}</span>
        </button>

        <button onClick={handleComment} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
            <CommentIcon className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-xs font-semibold">{commentsCount}</span>
        </button>

        <button onClick={handleFavorite} className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
              isFavorited ? "bg-yellow-500/20" : "bg-white/20 hover:bg-white/30",
            )}
          >
            <StarIcon className={cn("h-6 w-6", isFavorited ? "text-yellow-500" : "text-white")} filled={isFavorited} />
          </div>
        </button>

        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
            <ShareIcon className="h-6 w-6 text-white" />
          </div>
        </button>

        <PostOptionsMenu
          postId={reel.id}
          userId={reel.user_id}
          currentUserId={userId}
          isAdult={false} // Reels are usually not adult or handled differently, but we can pass logic if needed
          trigger={
            <button className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                <MoreVertical className="h-6 w-6 text-white" />
              </div>
            </button>
          }
        />
      </div>

      <div className="absolute bottom-4 left-4 right-20 z-10 pointer-events-auto">
        <Link href={`/${reel.profiles.handle}`} className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarImage src={reel.profiles.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-[#00d4ff] to-[#38bdf8] text-white">
              {reel.profiles.display_name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-semibold">{reel.profiles.display_name}</p>
            <p className="text-white/80 text-sm">@{reel.profiles.handle}</p>
          </div>
        </Link>

        {reel.caption && <p className="text-white text-sm line-clamp-2">{reel.caption}</p>}
      </div>

      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          postId={reel.id}
          postUrl={`${window.location.origin}/post/${reel.id}`}
        />
      )}

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
    </div>
  )
}
