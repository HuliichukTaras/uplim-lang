"use client"
import { Link } from "@/i18n/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Eye, Users, TrendingUp, CheckCircle2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface PromotionDetailsProps {
  promotion: any
  impressions: any[]
}

export function PromotionDetails({ promotion, impressions }: PromotionDetailsProps) {
  const progress = Math.min(Math.round((promotion.views_delivered / promotion.estimated_views) * 100), 100)
  const isActive = promotion.status === "active"
  const isCompleted = promotion.status === "completed"

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { label: "Active", className: "bg-green-500" },
      completed: { label: "Completed", className: "bg-blue-500" },
      pending: { label: "Pending Payment", className: "bg-yellow-500" },
      cancelled: { label: "Cancelled", className: "bg-gray-500" },
    }
    const config = variants[status] || variants.pending
    return <Badge className={config.className}>{config.label}</Badge>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/promote">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Promotions
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">Promotion Performance</CardTitle>
                  <p className="text-gray-600 mt-1">
                    Started {formatDistanceToNow(new Date(promotion.start_date))} ago
                  </p>
                </div>
                {getStatusBadge(promotion.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-600">Views</span>
                  </div>
                  <p className="text-2xl font-bold">{promotion.views_delivered.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">of {promotion.estimated_views.toLocaleString()}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-600">Profile Visits</span>
                  </div>
                  <p className="text-2xl font-bold">{promotion.profile_visits_delivered || 0}</p>
                  <p className="text-xs text-gray-500">estimated</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-gray-600">Budget</span>
                  </div>
                  <p className="text-2xl font-bold">€{promotion.budget_eur}</p>
                  <p className="text-xs text-gray-500">total spent</p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-600" />
                    <span className="text-sm text-gray-600">Progress</span>
                  </div>
                  <p className="text-2xl font-bold">{progress}%</p>
                  <p className="text-xs text-gray-500">completion</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Campaign Progress</span>
                  <span className="text-sm text-gray-600">
                    {promotion.views_delivered} / {promotion.estimated_views} views
                  </span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              {isCompleted && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">Campaign Completed!</p>
                      <p className="text-sm text-blue-700">
                        Your promotion has successfully delivered all estimated views.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Impressions</CardTitle>
            </CardHeader>
            <CardContent>
              {impressions.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No impressions yet</p>
              ) : (
                <div className="space-y-3">
                  {impressions.slice(0, 10).map((impression) => (
                    <div key={impression.id} className="flex items-center gap-3 pb-3 border-b last:border-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                        {impression.profiles?.avatar_url ? (
                          <Image
                            src={impression.profiles.avatar_url || "/placeholder.svg"}
                            alt={impression.profiles.display_name}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500">
                            <span className="text-white font-semibold text-sm">
                              {impression.profiles?.display_name?.[0]?.toUpperCase() || "?"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{impression.profiles?.display_name || "Anonymous User"}</p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(impression.timestamp))} ago
                        </p>
                      </div>
                      <Eye className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Promoted Post</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4">
                {promotion.posts?.media_urls?.[0] ? (
                  <Image
                    src={promotion.posts.media_urls[0] || "/placeholder.svg"}
                    alt="Post"
                    width={400}
                    height={400}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Eye className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              {promotion.posts?.caption && (
                <p className="text-sm text-gray-600 line-clamp-4 mb-4">{promotion.posts.caption}</p>
              )}
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href={`/post/${promotion.post_id}`}>View Full Post</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status</span>
                {getStatusBadge(promotion.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Budget</span>
                <span className="font-medium">€{promotion.budget_eur}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Started</span>
                <span className="font-medium">{new Date(promotion.start_date).toLocaleDateString()}</span>
              </div>
              {promotion.end_date && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-medium">{new Date(promotion.end_date).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
