"use client"

import { useState } from "react"
import { Link } from "@/i18n/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Eye, Users, Clock, CheckCircle2, AlertCircle, Megaphone, Play } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PromoteHomeProps {
  promotions: any[]
  userId: string
  userPosts: any[]
}

export function PromoteHome({ promotions: initialPromotions, userId, userPosts }: PromoteHomeProps) {
  const [promotions] = useState(initialPromotions)

  const activePromotions = promotions.filter((p) => {
    // Only show active promotions that are actually paid/active
    if (p.status === "active") return true

    // For pending promotions, only show very recent ones (less than 5 mins)
    // This prevents "stale" payment attempts from showing up
    if (p.status === "pending") {
      const createdAt = new Date(p.created_at).getTime()
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      return createdAt > fiveMinutesAgo
    }
    return false
  })

  const completedPromotions = promotions.filter((p) => p.status === "completed")
  const blockedPromotions = promotions.filter((p) => p.status === "blocked_by_policy")

  const availablePosts = userPosts.filter(
    (post) => !post.is_adult && ((post.media_urls && post.media_urls.length > 0) || post.video_url),
  )

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { label: "Active", className: "bg-green-500" },
      completed: { label: "Completed", className: "bg-blue-500" },
      pending: { label: "Pending", className: "bg-yellow-500" },
      cancelled: { label: "Cancelled", className: "bg-gray-500" },
      blocked_by_policy: { label: "Blocked", className: "bg-red-500" },
    }
    const config = variants[status] || variants.pending
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getProgress = (delivered: number, estimated: number) => {
    return Math.min(Math.round((delivered / estimated) * 100), 100)
  }

  const MediaPreview = ({ post }: { post: any }) => {
    const url = post?.video_url || post?.media_urls?.[0]

    if (!url) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <Image className="w-8 h-8 text-gray-400" src="/placeholder.svg" alt="Placeholder" width={32} height={32} />
        </div>
      )
    }

    const isVideo =
      post.content_type === "video" || url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || !!post.video_url

    if (isVideo) {
      return (
        <div className="relative w-full h-full">
          <video
            src={url}
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
          <div className="absolute top-1 right-1 pointer-events-none">
            <Play className="w-3 h-3 text-white drop-shadow-md" fill="currentColor" />
          </div>
        </div>
      )
    }

    return (
      <Image
        src={url || "/placeholder.svg"}
        alt="Post preview"
        width={96}
        height={96}
        className="object-cover w-full h-full"
      />
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mini Ads Manager</h1>
        <p className="text-gray-600">Promote your content and reach more people</p>
      </div>

      {blockedPromotions.length > 0 && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {blockedPromotions.length} promotion{blockedPromotions.length > 1 ? "s" : ""}{" "}
            {blockedPromotions.length > 1 ? "have" : "has"} been blocked because the post
            {blockedPromotions.length > 1 ? "s" : ""} became 18+ after promotion started. Only non-18+ content can be
            promoted.
          </AlertDescription>
        </Alert>
      )}

      <Alert className="mb-6 border-blue-200 bg-blue-50">
        <TrendingUp className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Promotion Rules:</strong> Only non-18+ posts can be promoted. If a post is marked as 18+ after
          promotion starts, it will be automatically paused.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Promotions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePromotions.length}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views Delivered</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {promotions.reduce((sum, p) => sum + (p.views_delivered || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Across all promotions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €
              {promotions
                .filter((p) => p.status === "active" || p.status === "completed")
                .reduce((sum, p) => sum + Number(p.budget_eur || 0), 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Lifetime investment</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="my-posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-posts">My Posts ({availablePosts.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activePromotions.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedPromotions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="my-posts" className="space-y-4">
          {availablePosts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Megaphone className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">No posts available for promotion</p>
                <p className="text-sm text-gray-500 mb-4">Create non-18+ posts to promote them</p>
                <Button asChild>
                  <Link href="/upload">Create Post</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {availablePosts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <MediaPreview post={post} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {post.caption?.substring(0, 50) || "Untitled Post"}
                              {post.caption?.length > 50 && "..."}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {post.likes_count || 0} likes • {post.views_count || 0} views
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-4 mt-4">
                          <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600">
                            <Link href={`/promote/create?post=${post.id}`}>
                              <Megaphone className="w-4 h-4 mr-2" />
                              Promote This Post
                            </Link>
                          </Button>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/post/${post.id}`}>View Post</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activePromotions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">No active promotions</p>
                <p className="text-sm text-gray-500 mb-4">
                  Go to your posts and click "Promote" to start boosting your content
                </p>
                <Button asChild>
                  <Link href="/dashboard">View My Posts</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            activePromotions.map((promotion) => (
              <Card key={promotion.id}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <MediaPreview post={promotion.posts} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {promotion.posts?.caption?.substring(0, 50) || "Promoted Post"}
                            {promotion.posts?.caption?.length > 50 && "..."}
                          </h3>
                          <p className="text-sm text-gray-600">Budget: €{promotion.budget_eur}</p>
                        </div>
                        {getStatusBadge(promotion.status)}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">
                            {promotion.views_delivered} / {promotion.estimated_views} views
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${getProgress(promotion.views_delivered, promotion.estimated_views)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 mt-4">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/promote/${promotion.id}`}>View Details</Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/post/${promotion.post_id}`}>View Post</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedPromotions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">No completed promotions yet</p>
              </CardContent>
            </Card>
          ) : (
            completedPromotions.map((promotion) => (
              <Card key={promotion.id}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <MediaPreview post={promotion.posts} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {promotion.posts?.caption?.substring(0, 50) || "Promoted Post"}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Budget: €{promotion.budget_eur} • Delivered: {promotion.views_delivered} views
                          </p>
                        </div>
                        {getStatusBadge(promotion.status)}
                      </div>

                      <div className="flex gap-6 mt-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-gray-500" />
                          <span>{promotion.views_delivered.toLocaleString()} views</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span>{promotion.profile_visits_delivered || 0} visits</span>
                        </div>
                      </div>

                      <Button asChild variant="outline" size="sm" className="mt-4 bg-transparent">
                        <Link href={`/promote/${promotion.id}`}>View Report</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
