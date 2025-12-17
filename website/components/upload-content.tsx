"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { ensureWalletExists } from "@/lib/supabase/ensure-wallet"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { upload } from "@vercel/blob/client"
import Link from "next/link"

import { MediaUploader, type MediaItem } from "@/components/create/media-uploader"
import { CaptionInput } from "@/components/create/caption-input"
import { AdultDetectionInfo } from "@/components/create/adult-detection-info"
import { MonetizationSettings } from "@/components/create/monetization-settings"

const LINK_PATTERN = /(https?:\/\/|www\.|[a-zA-Z0-9-]+\.(com|net|org|io|dev|app|co|ru|ua|uk))/gi
const MULTIPART_UPLOAD_THRESHOLD = 25 * 1024 * 1024
const MINIMUM_FOLLOWERS_FOR_MONETIZATION = 2500

function detectContentType(mediaItems: MediaItem[]): string {
  const videoItem = mediaItems.find((item) => item.type === "video")
  if (videoItem) {
    const aspectRatio = videoItem.aspectRatio || 0
    const duration = videoItem.duration || 0
    if (aspectRatio >= 1.5 && duration <= 60) return "reel"
    return "video_post"
  }
  if (mediaItems.length > 1) return "gallery_post"
  return "image_post"
}

function extractHashtags(caption: string): string[] {
  const hashtagPattern = /#[\w\u0400-\u04FF]+/g
  return caption.match(hashtagPattern)?.map((tag) => tag.slice(1)) || []
}

const generateVideoThumbnail = (file: File, time = 1): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    video.preload = "metadata"
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(time, video.duration)
    }
    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext("2d")
        if (!ctx) throw new Error("Could not get canvas context")
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error("Thumbnail generation failed"))
            URL.revokeObjectURL(video.src)
          },
          "image/jpeg",
          0.8,
        )
      } catch (e) {
        reject(e)
      }
    }
    video.onerror = () => reject(new Error("Video load error"))
    video.src = URL.createObjectURL(file)
  })
}

export function UploadContent({ userId }: { userId: string }) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [caption, setCaption] = useState("")
  const [unlockViaPPV, setUnlockViaPPV] = useState(false)
  const [ppvPrice, setPPVPrice] = useState("5.00")
  const [isAdult, setIsAdult] = useState(false)
  const [adultConfidence, setAdultConfidence] = useState(0)
  const [defaultPPVPrice, setDefaultPPVPrice] = useState("5.00")
  const [subscriptionPrice, setSubscriptionPrice] = useState<string | null>(null)
  const [followersCount, setFollowersCount] = useState(0)
  const [canMonetize, setCanMonetize] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [moderationWarning, setModerationWarning] = useState<string | null>(null)
  const [isEmailVerified, setIsEmailVerified] = useState(true)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkEmailVerification = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user && !user.email_confirmed_at) setIsEmailVerified(false)
    }
    checkEmailVerification()
  }, [supabase])

  useEffect(() => {
    const fetchCreatorSettings = async () => {
      const { data } = await supabase
        .from("creator_settings")
        .select("subscription_price, default_ppv_price")
        .eq("id", userId)
        .single()
      if (data) {
        setSubscriptionPrice(data.subscription_price?.toString() || null)
        setDefaultPPVPrice(data.default_ppv_price?.toString() || "5.00")
      }
    }
    fetchCreatorSettings()
  }, [userId, supabase])

  useEffect(() => {
    const checkFollowersCount = async () => {
      const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId)
      const currentFollowers = count || 0
      setFollowersCount(currentFollowers)
      setCanMonetize(currentFollowers >= MINIMUM_FOLLOWERS_FOR_MONETIZATION)
    }
    checkFollowersCount()
  }, [userId, supabase])

  const handleModerationUpdate = (updatedItems: MediaItem[]) => {
    const hasNsfw = updatedItems.some((item) => item.isNsfw && (item.nsfwConfidence || 0) > 0.7)
    if (hasNsfw) {
      const maxConfidence = Math.max(...updatedItems.map((item) => item.nsfwConfidence || 0))
      setIsAdult(true)
      setAdultConfidence(maxConfidence)
      setUnlockViaPPV(true)
      setPPVPrice("1.50")
      setModerationWarning("18+ content detected")
    }
  }

  const uploadAndModerate = async (item: MediaItem) => {
    const safeName = item.file.name.replace(/[^a-zA-Z0-9._-]/g, "-")
    const uniqueSuffix =
      typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Date.now().toString()
    const pathname = `creator-uploads/${userId}/${uniqueSuffix}-${safeName}`

    try {
      let blobUrl: string

      try {
        const blob = await upload(pathname, item.file, {
          access: "public",
          handleUploadUrl: "/api/upload/token",
          multipart: item.file.size > MULTIPART_UPLOAD_THRESHOLD,
        })
        blobUrl = blob.url
      } catch (uploadError) {
        const formData = new FormData()
        formData.append("file", item.file)
        const serverResponse = await fetch("/api/upload", { method: "POST", body: formData })
        if (!serverResponse.ok) throw new Error(`Server upload failed: ${serverResponse.statusText}`)
        const serverData = await serverResponse.json()
        blobUrl = serverData.url
      }

      const moderationResponse = await fetch("/api/upload/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: blobUrl, mediaType: item.type }),
      })
      const moderationData = await moderationResponse.json().catch(() => null)

      if (!moderationResponse.ok || !moderationData?.success) {
        return { url: blobUrl, moderation: { isNsfw: false, confidence: 0 } }
      }

      return { url: blobUrl, moderation: moderationData.moderation }
    } catch (error) {
      throw new Error(`Failed to upload ${item.file.name}: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isEmailVerified) {
      setError("Please verify your email first")
      return
    }

    if (mediaItems.length === 0) {
      setError("Add at least one photo or video")
      return
    }

    const MAX_IMAGE_SIZE = 50 * 1024 * 1024
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024

    for (const item of mediaItems) {
      if (item.type === "image" && item.file.size > MAX_IMAGE_SIZE) {
        setError(`Image too large (max 50MB)`)
        return
      }
      if (item.type === "video" && item.file.size > MAX_VIDEO_SIZE) {
        setError(`Video too large (max 100MB)`)
        return
      }
    }

    if (LINK_PATTERN.test(caption)) {
      setError("Links are not allowed")
      return
    }

    if (unlockViaPPV && (!ppvPrice || Number.parseFloat(ppvPrice) < 0.5)) {
      setError("Minimum price is €0.50")
      return
    }

    setIsUploading(true)
    setError(null)
    setModerationWarning(null)
    setUploadProgress(0)

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.refreshSession()
      if (sessionError || !session) throw new Error("Session expired. Please log in again.")

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Please log in to create a post")

      await ensureWalletExists(supabase, user.id)

      const imageItems = mediaItems.filter((item) => item.type === "image")
      const videoItem = mediaItems.find((item) => item.type === "video")

      const mediaUrls: string[] = []
      let videoUrl: string | null = null
      let thumbnailUrl: string | null = null
      const moderationMeta: any = {}
      const totalFiles = mediaItems.length
      let uploadedFiles = 0

      for (const item of imageItems) {
        const { url, moderation } = await uploadAndModerate(item)
        mediaUrls.push(url)
        if (moderation?.isNsfw) moderationMeta[url] = moderation.metadata
        uploadedFiles++
        setUploadProgress(Math.round((uploadedFiles / totalFiles) * 100))
      }

      if (videoItem) {
        const thumbnailBlob = await generateVideoThumbnail(videoItem.file, videoItem.thumbnailTime || 1)
        const thumbnailFile = new File([thumbnailBlob], "thumbnail.jpg", { type: "image/jpeg" })
        const thumbnailPath = `creator-uploads/${userId}/thumb-${Date.now()}.jpg`
        const thumbnailUpload = await upload(thumbnailPath, thumbnailFile, {
          access: "public",
          handleUploadUrl: "/api/upload/token",
        })
        thumbnailUrl = thumbnailUpload.url

        const { url, moderation } = await uploadAndModerate(videoItem)
        videoUrl = url
        if (moderation?.isNsfw) moderationMeta[url] = moderation.metadata
        uploadedFiles++
        setUploadProgress(Math.round((uploadedFiles / totalFiles) * 100))
      }

      const detectedNsfw = mediaItems.some((item) => item.isNsfw && (item.nsfwConfidence || 0) > 0.7)
      const maxConfidence = Math.max(...mediaItems.map((item) => item.nsfwConfidence || 0))
      const isSensitive = detectedNsfw && maxConfidence > 0.7
      const finalPPVPrice = isSensitive ? "1.50" : unlockViaPPV ? ppvPrice : null
      const tags = extractHashtags(caption)
      const contentType = detectContentType(mediaItems)

      const postData = {
        user_id: userId,
        caption: caption || null,
        media_urls: mediaUrls,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl || (contentType !== "reel" && contentType !== "video_post" ? mediaUrls[0] : null),
        content_type: contentType,
        post_type: contentType === "reel" ? "reel" : "post",
        is_nsfw: isSensitive,
        is_adult: isSensitive,
        adult_confidence: maxConfidence,
        blur_required: isSensitive,
        is_locked: isSensitive || (unlockViaPPV && canMonetize),
        is_paid: isSensitive || (unlockViaPPV && canMonetize),
        price: finalPPVPrice ? Number.parseFloat(finalPPVPrice) : 0,
        ppv_price_cents: isSensitive ? 150 : finalPPVPrice ? Math.round(Number.parseFloat(finalPPVPrice) * 100) : null,
        unlock_via_subscription: true,
        unlock_via_ppv: isSensitive || unlockViaPPV,
        unlock_via_quest: true,
        quest_type: "like_and_share",
        quest_target: 1,
        tags: tags,
        duration: videoItem?.duration ? Math.round(videoItem.duration) : null,
        curiosity_unlock: false,
        blur_level: isSensitive ? 3 : 0,
        moderation_meta: Object.keys(moderationMeta).length > 0 ? moderationMeta : null,
        moderation_status: "approved",
        unlock_methods: isSensitive
          ? ["microtransaction", "subscription", "quest"]
          : unlockViaPPV
            ? ["microtransaction"]
            : [],
      }

      const { error: postError } = await supabase.from("posts").insert(postData)
      if (postError) {
        if (postError.code === "42501") throw new Error("Permission denied. Please log in again.")
        else if (postError.code === "23505") throw new Error("Duplicate post. Please try again.")
        else throw new Error(`Failed to create post: ${postError.message}`)
      }

      router.push(contentType === "reel" ? "/reels" : "/feed")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          <Link href="/feed" className="p-2 -ml-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold">New post</h1>
          <Button
            type="submit"
            form="upload-form"
            size="sm"
            disabled={isUploading || mediaItems.length === 0}
            className="font-semibold"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Share"}
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        {/* Email verification warning */}
        {!isEmailVerified && (
          <Alert className="m-4 border-amber-500 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900 text-sm">Verify your email to post content</AlertDescription>
          </Alert>
        )}

        <form id="upload-form" onSubmit={handleSubmit} className="space-y-4 p-4">
          {/* Media uploader - full width */}
          <MediaUploader
            mediaItems={mediaItems}
            onMediaChange={setMediaItems}
            onError={setError}
            onModerationUpdate={handleModerationUpdate}
          />

          {/* Caption - minimal */}
          {mediaItems.length > 0 && (
            <>
              <CaptionInput value={caption} onChange={setCaption} />

              {/* 18+ detection info - only shows when detected */}
              <AdultDetectionInfo
                isAdult={isAdult}
                adultConfidence={adultConfidence}
                moderationWarning={moderationWarning}
              />

              {/* Monetization - minimal */}
              <MonetizationSettings
                unlockViaPPV={unlockViaPPV}
                onPPVChange={setUnlockViaPPV}
                ppvPrice={ppvPrice}
                onPPVPriceChange={setPPVPrice}
                isAdult={isAdult}
                subscriptionPrice={subscriptionPrice}
                canMonetize={canMonetize}
                followersCount={followersCount}
                minimumFollowers={MINIMUM_FOLLOWERS_FOR_MONETIZATION}
              />

              <p className="text-xs text-muted-foreground text-center px-4">
                All uploads are scanned by AI. 18+ content is automatically detected and locked.
              </p>
            </>
          )}

          {/* Error display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Upload progress */}
          {isUploading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-center text-muted-foreground">Uploading... {uploadProgress}%</p>
            </div>
          )}
        </form>
      </main>
    </div>
  )
}
