"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PlayCircle, Users } from "lucide-react"
import { Link } from "@/i18n/navigation"
import CreateLiveStreamDialog from "./create-livestream-dialog"

interface Profile {
  id: string
  handle: string // Changed from 'username' to 'handle'
  display_name: string | null
  avatar_url: string | null
}

interface LiveStream {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  viewer_count: number
  started_at: string
  creator: Profile
}

export default function LiveStreamsClient({
  currentUser,
}: {
  currentUser: Profile | null
}) {
  const [livestreams, setLivestreams] = useState<LiveStream[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLivestreams()
    // Poll for updates every 5 seconds
    const interval = setInterval(loadLivestreams, 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadLivestreams() {
    try {
      const res = await fetch(`/api/livestream/active?t=${Date.now()}`, {
        cache: "no-store",
      })
      const data = await res.json()
      if (data.livestreams) {
        setLivestreams(data.livestreams)
      }
    } catch (error) {
      console.error("[v0] Failed to load livestreams:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background">
      {/* Standardized live streams container to 1200px */}
      <div className="container mx-auto max-w-[1200px] px-4 md:px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Live Streams</h1>
            <p className="text-muted-foreground mt-2">Watch live streams from creators you follow</p>
          </div>
          {currentUser && <CreateLiveStreamDialog onSuccess={loadLivestreams} />}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : livestreams.length === 0 ? (
          <Card className="p-12 text-center">
            <PlayCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Live Streams</h3>
            <p className="text-muted-foreground">Check back later for live streams from creators you follow</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {livestreams.map((stream) => (
              <Link key={stream.id} href={`/live/${stream.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="relative aspect-video bg-muted">
                    {stream.thumbnail_url ? (
                      <img
                        src={stream.thumbnail_url || "/placeholder.svg"}
                        alt={stream.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PlayCircle className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    <Badge className="absolute top-2 left-2 bg-red-600">LIVE</Badge>
                    <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded flex items-center gap-1 text-white text-sm">
                      <Users className="w-4 h-4" />
                      {stream.viewer_count}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={stream.creator.avatar_url || undefined} />
                        <AvatarFallback>{stream.creator.display_name?.[0] || stream.creator.handle[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{stream.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {stream.creator.display_name || `@${stream.creator.handle}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
