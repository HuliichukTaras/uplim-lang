"use client"

import type React from "react"

import { useState } from "react"
import { Link } from "@/i18n/navigation"
import { MoreHorizontal, Trash2, TrendingUp, Flag, Share2, Copy } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ShareModal } from "@/components/interaction/share-modal"
import { ReportCopyrightModal } from "@/components/report-copyright-modal"
import { cn } from "@/lib/utils"

interface PostOptionsMenuProps {
  postId: string
  userId: string // The owner of the post
  currentUserId?: string | null
  isAdult?: boolean
  postUrl?: string
  onDelete?: () => void
  trigger?: React.ReactNode
  align?: "start" | "end" | "center"
  className?: string
}

export function PostOptionsMenu({
  postId,
  userId,
  currentUserId,
  isAdult = false,
  postUrl,
  onDelete,
  trigger,
  align = "end",
  className,
}: PostOptionsMenuProps) {
  const [showShareModal, setShowShareModal] = useState(false)
  const [showCopyrightModal, setShowCopyrightModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = createClient()

  const finalPostUrl = postUrl || `${typeof window !== "undefined" ? window.location.origin : ""}/post/${postId}`

  const handleDeletePost = async () => {
    if (!currentUserId || userId !== currentUserId) return
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) return

    setIsDeleting(true)
    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId).eq("user_id", currentUserId)

      if (!error) {
        if (onDelete) {
          onDelete()
        } else {
          window.location.reload()
        }
      }
    } catch (error) {
      console.error("Delete error:", error)
      alert("Failed to delete post. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger || (
            <button className={cn("p-2 hover:bg-gray-100 rounded-full transition-colors", className)}>
              <MoreHorizontal className="w-5 h-5 text-black" />
            </button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align}>
          {currentUserId === userId && !isAdult && (
            <DropdownMenuItem asChild>
              <Link href={`/promote/create?post=${postId}`} className="flex items-center cursor-pointer">
                <TrendingUp className="w-4 h-4 mr-2 text-orange-600" />
                <span className="font-medium">Promote Post</span>
              </Link>
            </DropdownMenuItem>
          )}

          {currentUserId === userId && (
            <DropdownMenuItem onClick={handleDeletePost} disabled={isDeleting} className="text-red-600 cursor-pointer">
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? "Deleting..." : "Delete Post"}
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={() => setShowCopyrightModal(true)} className="cursor-pointer">
            <Flag className="w-4 h-4 mr-2" />
            Report Copyright Violation
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer">
            <Flag className="w-4 h-4 mr-2" />
            Report Content
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setShowShareModal(true)} className="cursor-pointer">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(finalPostUrl)} className="cursor-pointer">
            <Copy className="w-4 h-4 mr-2" />
            Copy link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        postId={postId}
        postUrl={finalPostUrl}
      />

      <ReportCopyrightModal isOpen={showCopyrightModal} onClose={() => setShowCopyrightModal(false)} postId={postId} />
    </>
  )
}
