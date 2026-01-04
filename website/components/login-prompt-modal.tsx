"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { LogIn, UserPlus } from "lucide-react"

interface LoginPromptModalProps {
  isOpen: boolean
  onClose: () => void
  action: "like" | "comment" | "follow" | "unlock" | "view"
}

export function LoginPromptModal({ isOpen, onClose, action }: LoginPromptModalProps) {
  const router = useRouter()

  const actionText = {
    like: "like this post",
    comment: "comment on this post",
    follow: "follow this creator",
    unlock: "unlock this content",
    view: "view this content",
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="neuro-raised rounded-3xl border-0 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#00d4ff] to-[#a855f7] bg-clip-text text-transparent">
            Join Fantikx
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Sign up or log in to {actionText[action]} and unlock the full Fantikx experience.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <Button onClick={() => router.push("/")} className="w-full glow-border-cyan neuro-raised" size="lg">
            <UserPlus className="h-5 w-5 mr-2" />
            Create Account
          </Button>
          <Button onClick={() => router.push("/")} variant="outline" className="w-full neuro-raised" size="lg">
            <LogIn className="h-5 w-5 mr-2" />
            Log In
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
