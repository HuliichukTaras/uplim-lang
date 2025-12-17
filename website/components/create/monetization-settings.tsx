"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { DollarSign, Trophy, Lock, Users } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface MonetizationSettingsProps {
  unlockViaPPV: boolean
  onPPVChange: (enabled: boolean) => void
  ppvPrice: string
  onPPVPriceChange: (price: string) => void
  isAdult: boolean
  subscriptionPrice: string | null
  canMonetize?: boolean
  followersCount?: number
  minimumFollowers?: number
}

export function MonetizationSettings({
  unlockViaPPV,
  onPPVChange,
  ppvPrice,
  onPPVPriceChange,
  isAdult,
  subscriptionPrice,
  canMonetize = true,
  followersCount = 0,
  minimumFollowers = 2500,
}: MonetizationSettingsProps) {
  const canWithdrawEarnings = followersCount >= minimumFollowers

  return (
    <Card className="p-6 space-y-6 neuro-raised">
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Lock className="h-5 w-5 text-[#00d4ff]" />
          Unlock & Monetization
        </h3>
        <p className="text-sm text-gray-500 mb-4">Control how viewers can access your content</p>

        {!canWithdrawEarnings && (
          <Alert className="mb-4 border-blue-500/50 bg-blue-50/50">
            <Users className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              <strong>Revenue Sharing Info:</strong>
              <br />
              You can monetize content now, but earnings will be split as follows:
              <ul className="list-disc ml-4 mt-2">
                <li>
                  <strong>Before {minimumFollowers.toLocaleString()} followers:</strong> 100% revenue goes to platform
                </li>
                <li>
                  <strong>After {minimumFollowers.toLocaleString()} followers:</strong> 50/50 split (you can withdraw
                  your share)
                </li>
              </ul>
              <p className="mt-2 text-xs">
                Current followers: <strong>{followersCount.toLocaleString()}</strong> /{" "}
                {minimumFollowers.toLocaleString()}
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* For 18+ content, show locked info only */}
        {isAdult && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Locked content</p>
              <p className="text-xs text-muted-foreground">Price: 15 coins | Subscribers: free | Quest: available</p>
            </div>
          </div>
        )}

        {/* Minimal PPV toggle for non-adult content */}
        {!isAdult && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="ppv-toggle" className="text-sm font-medium cursor-pointer">
                  Paid content
                </Label>
              </div>
              <Switch id="ppv-toggle" checked={unlockViaPPV} onCheckedChange={onPPVChange} />
            </div>

            {unlockViaPPV && (
              <div className="flex items-center gap-2 pl-6">
                <span className="text-sm text-muted-foreground">Price:</span>
                <div className="relative w-24">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                  <Input
                    type="number"
                    step="0.50"
                    min="0.50"
                    max="50.00"
                    value={ppvPrice}
                    onChange={(e) => onPPVPriceChange(e.target.value)}
                    className="pl-6 h-8 text-sm"
                  />
                </div>
              </div>
            )}

            {followersCount < minimumFollowers && unlockViaPPV && (
              <p className="text-xs text-muted-foreground pl-6">
                Earnings available after {minimumFollowers.toLocaleString()} followers
              </p>
            )}
          </div>
        )}

        {/* Quest Unlock - Always active with default conditions */}
        <div className="p-4 rounded-xl neuro-inset mb-4 bg-gradient-to-br from-amber-50/50 to-amber-100/30">
          <div className="flex items-start gap-3">
            <Trophy className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="flex-1">
              <Label className="text-base font-semibold">Quest Unlock (Free)</Label>
              <p className="text-sm text-gray-600 mt-1 mb-3">Viewers can unlock for free by completing:</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-700 font-semibold text-xs">
                    1
                  </span>
                  <span>
                    Share this post <strong>5 times</strong>
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-700 font-semibold text-xs">
                    2
                  </span>
                  <span>
                    Like <strong>5 posts</strong> from you
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-700 font-semibold text-xs">
                    3
                  </span>
                  <span>
                    <strong>Follow</strong> your profile
                  </span>
                </li>
              </ul>
              <p className="text-xs text-gray-500 mt-3 italic">Applied automatically to all locked content</p>
            </div>
          </div>
        </div>

        {/* Updated summary text */}
        <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-200/50">
          <p className="text-sm text-blue-900">
            <strong>How unlock works:</strong>
          </p>
          <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4 list-disc">
            {isAdult ? (
              <>
                <li>
                  <strong>Micro-transaction:</strong> Viewers pay €1.50 to unlock instantly.
                </li>
                <li>
                  <strong>Subscription:</strong> Your subscribers view for free.
                </li>
                <li>
                  <strong>Quest:</strong> Viewers can Like + Share to unlock for free.
                </li>
              </>
            ) : (
              <>
                {subscriptionPrice && <li>Subscribers (${subscriptionPrice}/mo) view instantly</li>}
                {unlockViaPPV && <li>Pay ${ppvPrice || "0.00"} for instant unlock</li>}
                <li>Complete quest (Like + Share) for free unlock</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </Card>
  )
}
