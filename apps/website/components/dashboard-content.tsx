"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Users, ImageIcon, Megaphone, Play, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"
import { VerificationPanel } from "@/components/verification/verification-panel"
import Image from "next/image"
import { Link } from "@/i18n/navigation"

interface Stats {
  totalPosts: number
  totalViews: number
  totalLikes: number
  totalComments: number
  subscribers: number
}

const MINIMUM_FOLLOWERS_FOR_MONETIZATION = 2500

export function DashboardContent({ userId }: { userId: string }) {
  const [stats, setStats] = useState<Stats>({
    totalPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    subscribers: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [followersCount, setFollowersCount] = useState(0)
  const [canMonetize, setCanMonetize] = useState(false)
  const [userPosts, setUserPosts] = useState<any[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      console.log("[v0] Hash changed to:", hash)

      if (hash === "#create") {
        console.log("[v0] Redirecting to upload page")
        router.push("/upload")
      }
    }

    // Check hash on mount
    handleHashChange()

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange)

    return () => {
      window.removeEventListener("hashchange", handleHashChange)
    }
  }, [router])

  useEffect(() => {
    fetchStats()
    fetchFollowersCount()
    fetchUserPosts()
  }, [])

  const fetchStats = async () => {
    setIsLoading(true)

    // Fetch posts stats
    const { data: posts } = await supabase
      .from("posts")
      .select("likes_count, comments_count, views_count")
      .eq("user_id", userId)

    // Fetch subscribers
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("creator_id", userId)
      .eq("status", "active")

    if (posts) {
      setStats({
        totalPosts: posts.length,
        totalViews: posts.reduce((sum, p) => sum + (p.views_count || 0), 0),
        totalLikes: posts.reduce((sum, p) => sum + (p.likes_count || 0), 0),
        totalComments: posts.reduce((sum, p) => sum + (p.comments_count || 0), 0),
        subscribers: subs?.length || 0,
      })
    }

    setIsLoading(false)
  }

  const fetchFollowersCount = async () => {
    const { count } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId)

    const currentFollowers = count || 0
    setFollowersCount(currentFollowers)
    setCanMonetize(currentFollowers >= MINIMUM_FOLLOWERS_FOR_MONETIZATION)
  }

  const fetchUserPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(6)

    if (data) {
      setUserPosts(data)
    }
  }

  return (
    <div className="bg-background">
      <div className="container mx-auto max-w-[1200px] px-4 md:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/wallet")}>
              <Wallet className="w-4 h-4 mr-2" />
              Wallet
            </Button>
            <Button onClick={() => router.push("/upload")} size="lg">
              Create Post
            </Button>
          </div>
        </div>

        {!canMonetize && (
          <Card className="mb-6 border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Unlock Monetization</h3>
                  <span className="text-2xl font-bold text-amber-600">
                    {followersCount} / {MINIMUM_FOLLOWERS_FOR_MONETIZATION.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((followersCount / MINIMUM_FOLLOWERS_FOR_MONETIZATION) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  {MINIMUM_FOLLOWERS_FOR_MONETIZATION - followersCount > 0
                    ? `${(MINIMUM_FOLLOWERS_FOR_MONETIZATION - followersCount).toLocaleString()} more followers to unlock withdrawals`
                    : "Withdrawals unlocked!"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card
          className="mb-6 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => router.push("/promote")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center">
                  <Megaphone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Promote Your Content</h3>
                  <p className="text-sm text-gray-600">Reach more people with targeted ads</p>
                </div>
              </div>
              <Button variant="outline" className="bg-white hover:bg-amber-50">
                Get Started
              </Button>
            </div>
          </CardContent>
        </Card>

        {canMonetize && (
          <div className="mb-6">
            <VerificationPanel userId={userId} />
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Users className="h-8 w-8 text-purple-500 mb-2" />
                <p className="text-2xl font-bold">{followersCount}</p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <ImageIcon className="h-8 w-8 text-blue-500 mb-2" />
                <p className="text-2xl font-bold">{stats.totalPosts}</p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
                <p className="text-2xl font-bold">{stats.totalLikes}</p>
                <p className="text-xs text-muted-foreground">Likes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {userPosts.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Recent Posts</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/profile/@me">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {userPosts.map((post) => {
                  const isVideo =
                    post.content_type === "video" ||
                    post.media_urls?.[0]?.match(/\.(mp4|mov|webm)$/i) ||
                    !!post.video_url
                  const mediaUrl = post.video_url || post.media_urls?.[0] || "/placeholder.svg"

                  return (
                    <div key={post.id} className="relative group">
                      <Link href={`/post/${post.id}`}>
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
                          {isVideo ? (
                            <video
                              src={mediaUrl}
                              className="object-cover w-full h-full"
                              muted
                              playsInline
                              loop
                              onMouseOver={(e) => e.currentTarget.play()}
                              onMouseOut={(e) => {
                                e.currentTarget.pause()
                                e.currentTarget.currentTime = 0
                              }}
                            />
                          ) : (
                            <Image
                              src={mediaUrl || "/placeholder.svg"}
                              alt="Post"
                              width={200}
                              height={200}
                              className="object-cover w-full h-full"
                            />
                          )}

                          {isVideo && (
                            <div className="absolute top-2 right-2 z-10 pointer-events-none">
                              <Play className="w-5 h-5 text-white drop-shadow-md" fill="currentColor" />
                            </div>
                          )}
                        </div>
                      </Link>
                      {!post.is_adult && (
                        <Button
                          asChild
                          size="sm"
                          className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-amber-500 hover:bg-amber-600"
                        >
                          <Link href={`/promote/create?post=${post.id}`}>
                            <Megaphone className="w-4 h-4 mr-2" />
                            Promote
                          </Link>
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
