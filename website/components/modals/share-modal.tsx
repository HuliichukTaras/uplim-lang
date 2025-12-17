"use client"

import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  shareDestinations: { name: string; icon: any }[]
  handleShare: (dest: any) => void
  handleCopyLink: () => void
  copied: boolean
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  shareDestinations,
  handleShare,
  handleCopyLink,
  copied,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] rounded-2xl p-6">
        {" "}
        {/* Standardized modal width */}
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">Share Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {shareDestinations.map((dest) => {
            const IconComponent = dest.icon
            return (
              <button
                key={dest.name}
                onClick={() => handleShare(dest)}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-muted transition-colors text-left border border-transparent hover:border-border group"
              >
                <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-background flex items-center justify-center text-foreground transition-colors border border-border">
                  <IconComponent />
                </div>
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {dest.name}
                </span>
              </button>
            )
          })}

          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="w-full justify-start gap-4 p-4 h-auto rounded-xl border-border hover:bg-muted hover:text-foreground text-muted-foreground mt-2 bg-transparent"
          >
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground border border-border">
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </div>
            <span className="font-semibold">{copied ? "Link copied!" : "Copy link"}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ShareModal
