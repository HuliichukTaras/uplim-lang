import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, BarChart3, DollarSign, TrendingUp } from 'lucide-react'

interface CreatorToolbarProps {
  followersCount: number
  monetizationEnabled: boolean
  isCreator: boolean
}

export function CreatorToolbar({ followersCount, monetizationEnabled, isCreator }: CreatorToolbarProps) {
  const MONETIZATION_THRESHOLD = 2500
  const progress = Math.min((followersCount / MONETIZATION_THRESHOLD) * 100, 100)
  const canMonetize = followersCount >= MONETIZATION_THRESHOLD

  return (
    <div className="border-b border-border bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left: Quick Actions */}
          <div className="flex gap-2">
            <Button asChild size="sm" className="gap-2">
              <Link href="/upload">
                <Upload className="w-4 h-4" />
                Upload
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-2">
              <Link href="/dashboard">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Link>
            </Button>
            {canMonetize && (
              <Button asChild size="sm" variant="outline" className="gap-2">
                <Link href="/dashboard">
                  <DollarSign className="w-4 h-4" />
                  Earnings
                </Link>
              </Button>
            )}
          </div>

          {/* Right: Monetization Progress */}
          {!canMonetize && (
            <div className="flex-1 max-w-xs">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Monetization Progress</span>
                <span>
                  {followersCount} / {MONETIZATION_THRESHOLD}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
