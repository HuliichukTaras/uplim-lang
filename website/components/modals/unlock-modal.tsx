"use client"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Lock, Sparkles, Check, Wallet, Coins, Loader2, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { HeartIcon, ShareIcon } from "@/components/flaticon-icons"
import { ShareModal } from "@/components/interaction/share-modal"
import { useRouter } from "next/navigation"
import { eurToCoins } from "@/lib/wallet"
import { TopUpDialog } from "@/components/top-up-dialog"

interface UnlockModalProps {
  isOpen: boolean
  onClose: () => void
  postId: string
  creatorId: string
  price: number // EUR price from post
  onUnlock: () => void
}

export function UnlockModal({ isOpen, onClose, postId, creatorId, price, onUnlock }: UnlockModalProps) {
  const [activeTab, setActiveTab] = useState("coins")
  const [hasLiked, setHasLiked] = useState(false)
  const [hasShared, setHasShared] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showTopUpDialog, setShowTopUpDialog] = useState(false)
  const [subscriptionPrice, setSubscriptionPrice] = useState<number | null>(null)
  const [creatorName, setCreatorName] = useState<string>("")
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [coinsBalance, setCoinsBalance] = useState<number>(0)

  const supabase = createClient()
  const router = useRouter()
  const priceInCoins = eurToCoins(price)
  const hasEnoughCoins = coinsBalance >= priceInCoins

  // Fetch wallet balance and creator settings
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen) return
      setIsLoadingSettings(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setIsLoadingSettings(false)
        return
      }

      // Fetch wallet
      const { data: wallet } = await supabase.from("wallets").select("coins_balance").eq("user_id", user.id).single()

      if (wallet) {
        setCoinsBalance(wallet.coins_balance || 0)
      }

      // Fetch creator settings
      const { data: settings } = await supabase
        .from("creator_settings")
        .select("subscription_price")
        .eq("id", creatorId)
        .single()

      const { data: creatorProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", creatorId)
        .single()

      if (settings) {
        setSubscriptionPrice(settings.subscription_price)
      }
      if (creatorProfile) {
        setCreatorName(creatorProfile.display_name || "Creator")
      }

      // Check subscription status
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("subscriber_id", user.id)
        .eq("creator_id", creatorId)
        .eq("status", "active")
        .single()

      setIsSubscribed(!!subscription)

      // Check like status
      const { data: like } = await supabase
        .from("likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("post_id", postId)
        .single()

      setHasLiked(!!like)

      setIsLoadingSettings(false)
    }

    fetchData()
  }, [isOpen, creatorId, postId, supabase])

  const handleLike = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    if (!hasLiked) {
      await supabase.from("likes").insert({ user_id: user.id, post_id: postId })
      setHasLiked(true)
    }
  }

  const handleShareClick = () => {
    setShowShareModal(true)
  }

  const handleShareComplete = async () => {
    setHasShared(true)
    setShowShareModal(false)
    await fetch("/api/posts/track-share", {
      method: "POST",
      body: JSON.stringify({ postId }),
    })
  }

  const handleCoinUnlock = async () => {
    if (!hasEnoughCoins) {
      setShowTopUpDialog(true)
      return
    }

    setIsProcessing(true)
    try {
      const res = await fetch("/api/wallet/unlock-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          creatorId,
          amount: priceInCoins,
          unlockType: "payment",
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("Content unlocked!")
        onUnlock()
        onClose()
      } else {
        if (data.error === "Insufficient coins") {
          setShowTopUpDialog(true)
        } else {
          toast.error(data.error || "Failed to unlock")
        }
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleQuestComplete = async () => {
    if (!hasLiked || !hasShared) {
      toast.error("Complete all tasks first")
      return
    }

    setIsProcessing(true)
    try {
      const res = await fetch("/api/wallet/unlock-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          creatorId,
          unlockType: "quest",
        }),
      })

      if (res.ok) {
        toast.success("Quest completed! Content unlocked.")
        onUnlock()
        onClose()
      } else {
        toast.error("Failed to complete quest")
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSubscriptionUnlock = async () => {
    if (!isSubscribed) {
      // Redirect to subscription checkout
      setIsProcessing(true)
      try {
        const res = await fetch("/api/stripe/create-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creatorId }),
        })

        const data = await res.json()
        if (res.ok && data.url) {
          window.location.href = data.url
        } else {
          toast.error(data.error || "Failed to create subscription")
        }
      } catch (error) {
        toast.error("Something went wrong")
      } finally {
        setIsProcessing(false)
      }
      return
    }

    // Already subscribed - just unlock
    setIsProcessing(true)
    try {
      const res = await fetch("/api/wallet/unlock-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          creatorId,
          unlockType: "subscription",
        }),
      })

      if (res.ok) {
        toast.success("Content unlocked with subscription!")
        onUnlock()
        onClose()
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsProcessing(false)
    }
  }

  const isSubscriptionAvailable = subscriptionPrice !== null && subscriptionPrice > 0

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden bg-background rounded-2xl border border-border shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border p-6 text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">Unlock Content</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm mt-1">
              Choose how to access this content
            </DialogDescription>
          </div>

          <Tabs defaultValue="coins" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList
              className={`grid w-full p-1 bg-muted/50 rounded-none border-b ${isSubscriptionAvailable ? "grid-cols-3" : "grid-cols-2"}`}
            >
              <TabsTrigger
                value="coins"
                className="data-[state=active]:bg-background rounded-md py-2.5 text-sm font-medium"
              >
                <Coins className="w-4 h-4 mr-1.5" />
                Coins
              </TabsTrigger>
              <TabsTrigger
                value="quest"
                className="data-[state=active]:bg-background rounded-md py-2.5 text-sm font-medium"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Quest
              </TabsTrigger>
              {isSubscriptionAvailable && (
                <TabsTrigger
                  value="subscribe"
                  className="data-[state=active]:bg-background rounded-md py-2.5 text-sm font-medium"
                >
                  Subscribe
                </TabsTrigger>
              )}
            </TabsList>

            <div className="p-6">
              {/* Coins Tab */}
              <TabsContent value="coins" className="mt-0 space-y-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-3xl font-black text-amber-500 mb-1">
                    {priceInCoins} <Coins className="w-8 h-8" />
                  </div>
                  <p className="text-sm text-muted-foreground">≈ €{price.toFixed(2)}</p>
                </div>

                <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Your Balance</span>
                  <span className="font-bold flex items-center gap-1">
                    {coinsBalance} <Coins className="w-4 h-4 text-amber-500" />
                  </span>
                </div>

                {hasEnoughCoins ? (
                  <Button
                    onClick={handleCoinUnlock}
                    disabled={isProcessing}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-6 rounded-xl"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Wallet className="w-5 h-5 mr-2" />
                        Unlock for {priceInCoins} Coins
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-center text-red-500 font-medium text-sm">
                      Not enough coins (need {priceInCoins - coinsBalance} more)
                    </p>
                    <Button
                      onClick={() => setShowTopUpDialog(true)}
                      className="w-full bg-primary hover:bg-primary/90 font-bold py-6 rounded-xl"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Get More Coins
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Quest Tab */}
              <TabsContent value="quest" className="mt-0 space-y-4">
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-lg flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Free Unlock
                  </h3>
                  <p className="text-sm text-muted-foreground">Complete tasks to unlock for free</p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleLike}
                    disabled={hasLiked}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${hasLiked
                        ? "bg-green-500/10 border-green-500/30 text-green-600"
                        : "bg-card border-border hover:border-primary/50"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${hasLiked ? "bg-green-500/20" : "bg-muted"}`}
                      >
                        {hasLiked ? <Check className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
                      </div>
                      <span className="font-medium">Like this post</span>
                    </div>
                    {hasLiked && (
                      <span className="text-xs font-bold bg-green-500 text-white px-2 py-0.5 rounded-full">Done</span>
                    )}
                  </button>

                  <button
                    onClick={handleShareClick}
                    disabled={hasShared}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${hasShared
                        ? "bg-green-500/10 border-green-500/30 text-green-600"
                        : "bg-card border-border hover:border-primary/50"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${hasShared ? "bg-green-500/20" : "bg-muted"}`}
                      >
                        {hasShared ? <Check className="w-5 h-5" /> : <ShareIcon className="w-5 h-5" />}
                      </div>
                      <span className="font-medium">Share this post</span>
                    </div>
                    {hasShared && (
                      <span className="text-xs font-bold bg-green-500 text-white px-2 py-0.5 rounded-full">Done</span>
                    )}
                  </button>
                </div>

                <Button
                  onClick={handleQuestComplete}
                  disabled={!hasLiked || !hasShared || isProcessing}
                  className="w-full mt-2 bg-primary hover:bg-primary/90 font-bold py-6 rounded-xl disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : hasLiked && hasShared ? (
                    "Unlock Now"
                  ) : (
                    "Complete Tasks to Unlock"
                  )}
                </Button>
              </TabsContent>

              {/* Subscribe Tab */}
              {isSubscriptionAvailable && (
                <TabsContent value="subscribe" className="mt-0 space-y-4 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg">Subscribe to {creatorName}</h3>
                    <p className="text-sm text-muted-foreground mt-1">Unlimited access to all content</p>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-xl border">
                    <div className="text-3xl font-bold">
                      €{subscriptionPrice?.toFixed(2)}
                      <span className="text-sm text-muted-foreground font-normal ml-1">/month</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleSubscriptionUnlock}
                    disabled={isProcessing}
                    className={`w-full font-bold py-6 rounded-xl ${isSubscribed ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90"
                      }`}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isSubscribed ? (
                      "Unlock with Subscription"
                    ) : (
                      "Subscribe Now"
                    )}
                  </Button>
                </TabsContent>
              )}
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        postId={postId}
        postUrl={typeof window !== "undefined" ? `${window.location.origin}/post/${postId}` : ""}
        onShare={handleShareComplete}
      />

      {/* Top Up Dialog */}
      <TopUpDialog
        isOpen={showTopUpDialog}
        onClose={() => setShowTopUpDialog(false)}
        onSuccess={() => {
          setShowTopUpDialog(false)
          // Refresh balance
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              supabase
                .from("wallets")
                .select("coins_balance")
                .eq("user_id", user.id)
                .single()
                .then(({ data }) => {
                  if (data) setCoinsBalance(data.coins_balance || 0)
                })
            }
          })
        }}
      />
    </>
  )
}
