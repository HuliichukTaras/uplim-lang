"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Video } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from "@/hooks/use-toast"

export default function CreateLiveStreamDialog({
  onSuccess,
}: {
  onSuccess?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  async function handleCreate() {
    if (!title.trim()) return

    setLoading(true)
    try {
      console.log("[v0] Creating livestream with title:", title)
      
      const res = await fetch("/api/livestream/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      })

      const data = await res.json()
      
      console.log("[v0] Create livestream response:", res.status, data)

      if (res.ok && data.livestream) {
        toast({
          title: "Live stream created!",
          description: "Starting your broadcast...",
        })
        
        setOpen(false)
        setTitle("")
        setDescription("")
        onSuccess?.()
        router.push(`/live/${data.livestream.id}`)
      } else {
        toast({
          variant: "destructive",
          title: "Failed to create stream",
          description: data.error || "Please try again",
        })
      }
    } catch (error) {
      console.error("[v0] Create livestream error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create livestream. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Video className="w-4 h-4" />
          Go Live
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a Live Stream</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Stream Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your stream about?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers what to expect..."
              rows={3}
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={loading || !title.trim()}
            className="w-full"
          >
            {loading ? "Creating..." : "Start Live Stream"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
