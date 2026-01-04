"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { X, ImagePlus, Loader2, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

type MediaKind = "image" | "video"

export type MediaItem = {
  id: string
  file: File
  type: MediaKind
  preview: string
  aspectRatio?: number
  duration?: number
  isModerated?: boolean
  isNsfw?: boolean
  nsfwConfidence?: number
  moderationError?: string
  thumbnailTime?: number
}

const IMAGE_LIMIT = 10
const IMAGE_MAX_SIZE = 50 * 1024 * 1024
const VIDEO_MAX_SIZE = 100 * 1024 * 1024

const createMediaId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

interface MediaUploaderProps {
  mediaItems: MediaItem[]
  onMediaChange: (items: MediaItem[]) => void
  onError: (error: string | null) => void
  onModerationUpdate?: (items: MediaItem[]) => void
}

export function MediaUploader({ mediaItems, onMediaChange, onError, onModerationUpdate }: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [moderatingFiles, setModeratingFiles] = useState<Set<string>>(new Set())
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const mediaItemsRef = useRef(mediaItems)
  useEffect(() => {
    mediaItemsRef.current = mediaItems
  }, [mediaItems])

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      const files: File[] = []
      for (const item of items) {
        if (item.type.startsWith("image/") || item.type.startsWith("video/")) {
          const file = item.getAsFile()
          if (file) files.push(file)
        }
      }

      if (files.length > 0) {
        e.preventDefault()
        handleFiles(files)
      }
    }

    document.addEventListener("paste", handlePaste)
    return () => document.removeEventListener("paste", handlePaste)
  }, [])

  const detectAspectRatio = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      if (file.type.startsWith("image/")) {
        const img = new Image()
        img.onload = () => resolve(img.height / img.width)
        img.src = URL.createObjectURL(file)
      } else if (file.type.startsWith("video/")) {
        const video = document.createElement("video")
        video.onloadedmetadata = () => resolve(video.videoHeight / video.videoWidth)
        video.src = URL.createObjectURL(file)
      } else {
        resolve(1)
      }
    })
  }

  const detectDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      if (file.type.startsWith("video/")) {
        const video = document.createElement("video")
        video.onloadedmetadata = () => resolve(video.duration)
        video.src = URL.createObjectURL(file)
      } else {
        resolve(0)
      }
    })
  }

  const moderateFile = async (file: File, mediaId: string): Promise<{ isNsfw: boolean; confidence: number }> => {
    setModeratingFiles((prev) => new Set(prev).add(mediaId))

    try {
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(",")[1])
        }
      })
      reader.readAsDataURL(file)
      const base64Data = await base64Promise

      const response = await fetch("/api/upload/moderate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64: base64Data,
          mediaType: file.type.startsWith("video/") ? "video" : "image",
        }),
      })

      if (!response.ok) {
        return { isNsfw: false, confidence: 0 }
      }

      const data = await response.json()
      return {
        isNsfw: data.moderation?.isNsfw || false,
        confidence: data.moderation?.confidence || 0,
      }
    } catch (error) {
      return { isNsfw: false, confidence: 0 }
    } finally {
      setModeratingFiles((prev) => {
        const newSet = new Set(prev)
        newSet.delete(mediaId)
        return newSet
      })
    }
  }

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const incomingFiles = Array.from(files)
      if (incomingFiles.length === 0) return

      let hasVideo = mediaItems.some((item) => item.type === "video")
      let imageCount = mediaItems.filter((item) => item.type === "image").length
      const nextMedia: MediaItem[] = [...mediaItems]

      for (const file of incomingFiles) {
        const isImage = file.type.startsWith("image/")
        const isVideo = file.type.startsWith("video/")

        if (!isImage && !isVideo) {
          onError(`Unsupported format`)
          continue
        }

        if (isImage && file.size > IMAGE_MAX_SIZE) {
          onError(`Image too large (max 50MB)`)
          continue
        }

        if (isVideo && file.size > VIDEO_MAX_SIZE) {
          onError("Video too large (max 100MB)")
          continue
        }

        if (isVideo && hasVideo) {
          onError("Only 1 video per post")
          continue
        }

        if (isImage && imageCount >= IMAGE_LIMIT) {
          onError("Max 10 images")
          continue
        }

        const mediaType: MediaKind = isVideo ? "video" : "image"
        if (mediaType === "image") imageCount += 1
        else hasVideo = true

        const preview = URL.createObjectURL(file)
        const aspectRatio = await detectAspectRatio(file)
        const duration = await detectDuration(file)
        const mediaId = createMediaId()

        const newItem: MediaItem = {
          id: mediaId,
          file,
          type: mediaType,
          preview,
          aspectRatio,
          duration,
          isModerated: false,
          isNsfw: false,
          nsfwConfidence: 0,
          thumbnailTime: 1,
        }

        nextMedia.push(newItem)
        onMediaChange([...nextMedia])

        // Auto-select first video for thumbnail picker
        if (mediaType === "video" && !selectedVideoId) {
          setSelectedVideoId(mediaId)
        }

        moderateFile(file, mediaId).then(({ isNsfw, confidence }) => {
          const currentItems = mediaItemsRef.current
          const updatedMedia = currentItems.map((item) =>
            item.id === mediaId ? { ...item, isModerated: true, isNsfw, nsfwConfidence: confidence } : item,
          )
          onMediaChange(updatedMedia)
          if (onModerationUpdate) onModerationUpdate(updatedMedia)
        })
      }

      onError(null)
    },
    [mediaItems, onMediaChange, onError, onModerationUpdate, selectedVideoId],
  )

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
      e.target.value = ""
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const removeMediaItem = (id: string) => {
    const item = mediaItems.find((media) => media.id === id)
    if (item) URL.revokeObjectURL(item.preview)
    onMediaChange(mediaItems.filter((media) => media.id !== id))
    if (selectedVideoId === id) setSelectedVideoId(null)
  }

  const handleThumbnailTimeChange = (id: string, time: number) => {
    onMediaChange(mediaItems.map((item) => (item.id === id ? { ...item, thumbnailTime: time } : item)))
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const selectedVideo = mediaItems.find((item) => item.id === selectedVideoId)

  if (mediaItems.length === 0) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center min-h-[400px] rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/x-msvideo"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4 p-8">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <ImagePlus className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">Drag photos and videos here</p>
            <p className="text-sm text-muted-foreground mt-1">or paste from clipboard</p>
          </div>
          <Button type="button" variant="default" className="mt-2">
            Select from computer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main preview area */}
      <div className="relative rounded-2xl overflow-hidden bg-black">
        {selectedVideo ? (
          // Video preview with thumbnail selector
          <div className="relative">
            <video
              ref={videoRef}
              src={selectedVideo.preview}
              className="w-full max-h-[500px] object-contain"
              onEnded={() => setIsPlaying(false)}
            />

            {/* Play/Pause overlay */}
            <button
              type="button"
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
            >
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                {isPlaying ? <Pause className="w-8 h-8 text-black" /> : <Play className="w-8 h-8 text-black ml-1" />}
              </div>
            </button>

            {/* NSFW badge */}
            {selectedVideo.isModerated && selectedVideo.isNsfw && (
              <div className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                18+
              </div>
            )}

            {/* Moderation loading */}
            {!selectedVideo.isModerated && moderatingFiles.has(selectedVideo.id) && (
              <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/70 text-white text-xs rounded-full flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Checking...
              </div>
            )}

            {/* Thumbnail time selector */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white text-xs mb-2">Choose cover</p>
              <Slider
                value={[selectedVideo.thumbnailTime || 1]}
                min={0}
                max={selectedVideo.duration || 10}
                step={0.1}
                onValueChange={([val]) => handleThumbnailTimeChange(selectedVideo.id, val)}
                className="w-full"
              />
            </div>
          </div>
        ) : mediaItems[0]?.type === "image" ? (
          // Image preview
          <div className="relative">
            <img
              src={mediaItems[0].preview || "/placeholder.svg"}
              alt="Preview"
              className="w-full max-h-[500px] object-contain"
            />
            {mediaItems[0].isModerated && mediaItems[0].isNsfw && (
              <div className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                18+
              </div>
            )}
            {!mediaItems[0].isModerated && moderatingFiles.has(mediaItems[0].id) && (
              <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/70 text-white text-xs rounded-full flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Checking...
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Thumbnail strip for multiple items */}
      {mediaItems.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {mediaItems.map((item) => (
            <div
              key={item.id}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                selectedVideoId === item.id || (mediaItems[0].id === item.id && !selectedVideoId)
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground/50"
              }`}
              onClick={() => {
                if (item.type === "video") setSelectedVideoId(item.id)
              }}
            >
              {item.type === "image" ? (
                <img src={item.preview || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
              ) : (
                <video src={item.preview} className="w-full h-full object-cover" />
              )}

              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeMediaItem(item.id)
                }}
                className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center hover:bg-black"
              >
                <X className="w-3 h-3 text-white" />
              </button>

              {/* Video duration badge */}
              {item.type === "video" && item.duration && (
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-[10px] rounded">
                  {Math.floor(item.duration / 60)}:{String(Math.floor(item.duration % 60)).padStart(2, "0")}
                </div>
              )}

              {/* NSFW indicator */}
              {item.isNsfw && (
                <div className="absolute top-1 left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-[8px] text-white font-bold">18</span>
                </div>
              )}
            </div>
          ))}

          {/* Add more button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center hover:border-muted-foreground/50 transition-colors"
          >
            <ImagePlus className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/x-msvideo"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  )
}
