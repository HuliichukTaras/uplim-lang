"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Users, Heart, StopCircle, Send, UserPlus, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import DonateDialog from "./donate-dialog"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useFollow } from "@/hooks/useFollow"

interface LiveStreamViewerProps {
  livestream: any
  currentUser: any
  isSubscribed: boolean
  isCreator: boolean
}

export default function LiveStreamViewer({ livestream, currentUser, isSubscribed, isCreator }: LiveStreamViewerProps) {
  const [donations, setDonations] = useState<any[]>([])
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const supabase = createBrowserClient()
  const { toast } = useToast()

  const {
    isFollowing,
    toggleFollow,
    loading: followLoading,
  } = useFollow({
    userId: livestream.creator_id || livestream.creator?.id,
    currentUserId: currentUser?.id,
    initialIsFollowing: isSubscribed,
  })

  useEffect(() => {
    // Initialize MediaStream for creator
    if (isCreator && videoRef.current) {
      startWebcam()
    }

    // Load chat messages
    loadChatMessages()

    const channel = supabase
      .channel(`livestream:${livestream.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "livestream_chat",
          filter: `livestream_id=eq.${livestream.id}`,
        },
        (payload) => {
          setChatMessages((prev) => [...prev, payload.new])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [isCreator, livestream.id])

  useEffect(() => {
    // Auto-scroll chat to bottom
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  async function loadChatMessages() {
    try {
      console.log("[v0] Loading chat messages for livestream:", livestream.id)
      const res = await fetch(`/api/livestream/${livestream.id}/chat`)
      const data = await res.json()
      console.log("[v0] Chat messages loaded:", data)
      if (data.messages) {
        setChatMessages(data.messages)
      }
    } catch (error) {
      console.error("[v0] Failed to load chat:", error)
    }
  }

  async function startWebcam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error("[v0] Failed to access webcam:", error)
    }
  }

  async function endStream() {
    try {
      console.log("[v0] Ending stream:", livestream.id)
      const res = await fetch(`/api/livestream/${livestream.id}/end`, {
        method: "POST",
      })

      const data = await res.json()

      if (res.ok) {
        console.log("[v0] Stream ended successfully")

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }

        toast({
          title: "Stream Ended",
          description: "Your livestream has been ended successfully.",
        })
        window.location.href = "/live"
      } else {
        console.error("[v0] Failed to end stream:", data.error)
        toast({
          title: "Error",
          description: data.error || "Failed to end stream",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Failed to end stream:", error)
      toast({
        title: "Error",
        description: "Failed to end stream. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function sendChatMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || isSending) return

    setIsSending(true)
    try {
      console.log("[v0] Sending chat message:", message)
      const res = await fetch(`/api/livestream/${livestream.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })

      if (res.ok) {
        const data = await res.json()
        console.log("[v0] Message sent, response:", data)
        setMessage("")
        await loadChatMessages()
      }
    } catch (error) {
      console.error("[v0] Failed to send message:", error)
    } finally {
      setIsSending(false)
    }
  }

  if (!isSubscribed && !isCreator && !isFollowing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full shadow-lg border-2">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full overflow-hidden border-4 border-primary/20">
            <Avatar className="w-full h-full">
              <AvatarImage src={livestream.creator.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="text-xl">
                {livestream.creator.display_name?.[0] || livestream.creator.handle[0]}
              </AvatarFallback>
            </Avatar>
          </div>
          <h2 className="text-2xl font-bold mb-2">Follow to Watch</h2>
          <p className="text-muted-foreground mb-8">
            This live stream is exclusive to followers of <br />
            <span className="font-semibold text-foreground">
              {livestream.creator.display_name || `@${livestream.creator.handle}`}
            </span>
          </p>

          <div className="space-y-3">
            <Button className="w-full h-12 text-lg gap-2" size="lg" onClick={toggleFollow} disabled={followLoading}>
              {followLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
              Follow to Watch Live
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => router.push(`/${livestream.creator.handle}`)}
            >
              View Full Profile
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-black">
                {isCreator ? (
                  <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                ) : livestream.stream_url ? (
                  <video src={livestream.stream_url} autoPlay controls className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <p>Stream starting soon...</p>
                  </div>
                )}
                <Badge className="absolute top-4 left-4 bg-red-600">LIVE</Badge>
                <div className="absolute top-4 right-4 bg-black/70 px-3 py-2 rounded flex items-center gap-2 text-white">
                  <Users className="w-4 h-4" />
                  {livestream.viewer_count}
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={livestream.creator.avatar_url || undefined} />
                    <AvatarFallback>
                      {livestream.creator.display_name?.[0] || livestream.creator.handle[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold">{livestream.title}</h1>
                    <p className="text-muted-foreground">
                      {livestream.creator.display_name || `@${livestream.creator.handle}`}
                    </p>
                  </div>
                  {isCreator && (
                    <Button variant="destructive" onClick={endStream} className="gap-2">
                      <StopCircle className="w-4 h-4" />
                      End Stream
                    </Button>
                  )}
                </div>
                {livestream.description && <p className="text-muted-foreground">{livestream.description}</p>}
              </div>
            </Card>
          </div>

          {/* Chat & Donations */}
          <div className="space-y-6">
            {/* Donations */}
            {isSubscribed && !isCreator && <DonateDialog livestreamId={livestream.id} />}

            {/* Recent Donations */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Recent Donations</h3>
              <div className="space-y-3">
                {donations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No donations yet</p>
                ) : (
                  donations.map((donation) => (
                    <div key={donation.id} className="flex items-start gap-3">
                      <Heart className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">
                          ${donation.amount} from {donation.donor_name}
                        </p>
                        {donation.message && <p className="text-sm text-muted-foreground">{donation.message}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Live Chat */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Live Chat</h3>
              <div className="space-y-3 mb-4 h-64 overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No messages yet. Be the first to chat!
                  </p>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-2">
                      <Avatar className="w-6 h-6 flex-shrink-0">
                        <AvatarImage src={msg.user?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {msg.user?.display_name?.[0] || msg.user?.handle?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold">{msg.user?.display_name || `@${msg.user?.handle}`}</p>
                        <p className="text-sm break-words">{msg.message}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={sendChatMessage} className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Send a message..."
                  disabled={isSending}
                  maxLength={500}
                />
                <Button type="submit" size="icon" disabled={isSending || !message.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
