"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Eye,
  Users,
  UserPlus,
  Check,
  Loader2,
  TrendingUp,
  Sparkles,
  Wallet,
  CreditCard,
  AlertTriangle,
  ImageIcon,
} from "lucide-react"
import { PROMOTION_PACKAGES, calculateEstimates } from "@/lib/promotions/promotion-config"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function PaymentForm({
  amount,
  onSuccess,
  onError,
}: {
  amount: number
  onSuccess: () => void
  onError: (msg: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isReady, setIsReady] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setIsProcessing(true)

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/promote?success=true`,
      },
      redirect: "if_required",
    })

    if (submitError) {
      onError(submitError.message || "Payment failed")
      setIsProcessing(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <PaymentElement onChange={(event) => setIsReady(event.complete)} options={{ layout: "tabs" }} />
      <Button type="submit" disabled={!stripe || isProcessing || !isReady} className="w-full glow-border-cyan">
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay €${amount.toFixed(2)}`
        )}
      </Button>
    </form>
  )
}

interface PromoteCreateProps {
  post: any
  userId: string
  initialBalance?: number
}

export function PromoteCreate({ post, userId, initialBalance = 0 }: PromoteCreateProps) {
  const router = useRouter()
  const [selectedPackage, setSelectedPackage] = useState<(typeof PROMOTION_PACKAGES)[number]>(
    PROMOTION_PACKAGES[2],
  ) // Default to Popular Choice
  const [isProcessing, setIsProcessing] = useState(false)
  const [step, setStep] = useState<"select" | "review" | "payment">("select")
  const [walletBalance, setWalletBalance] = useState(initialBalance)
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "card">("wallet")
  const [customBudget, setCustomBudget] = useState<string>("")
  const [isCustomBudget, setIsCustomBudget] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [pendingPromotionId, setPendingPromotionId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBalance() {
      const supabase = createClient()
      const { data: wallet } = await supabase.from("wallets").select("available_balance").eq("user_id", userId).single()

      if (wallet) {
        setWalletBalance(wallet.available_balance)
        if (wallet.available_balance >= selectedPackage.budget) {
          setPaymentMethod("wallet")
        } else {
          setPaymentMethod("card")
        }
      }
    }
    fetchBalance()
  }, [userId, selectedPackage.budget])

  const currentBudget = isCustomBudget && customBudget ? Number.parseFloat(customBudget) : selectedPackage.budget
  const estimates = calculateEstimates(currentBudget)
  const hasSufficientBalance = walletBalance >= currentBudget

  const handleCreatePromotion = async () => {
    setIsProcessing(true)

    try {
      const finalBudget = Number(currentBudget)

      const response = await fetch("/api/promotions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          budgetEur: finalBudget,
          estimatedViews: estimates.estimatedViews,
          paymentMethod: paymentMethod,
        }),
      })

      const data = await response.json()

      if (data.success) {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
          setPendingPromotionId(data.promotionId)
          setIsProcessing(false)
        } else {
          router.push(`/promote/${data.promotionId}?success=true`)
        }
      } else {
        alert(data.error || "Failed to create promotion. Please try again.")
        setIsProcessing(false)
      }
    } catch (error) {
      console.error("Error creating promotion:", error)
      alert("An error occurred. Please try again.")
      setIsProcessing(false)
    }
  }

  const handleStripeSuccess = () => {
    if (pendingPromotionId) {
      router.push(`/promote/${pendingPromotionId}?success=true`)
    }
  }

  const MediaPreview = ({ post }: { post: any }) => {
    const url = post?.video_url || post?.media_urls?.[0]

    if (!url) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <ImageIcon className="w-12 h-12 text-gray-400" />
        </div>
      )
    }

    const isVideo =
      post.content_type === "video" || url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || !!post.video_url

    if (isVideo) {
      return <video src={url} className="object-cover w-full h-full" controls playsInline preload="metadata" />
    }

    return (
      <Image
        src={url || "/placeholder.svg"}
        alt="Post"
        width={400}
        height={400}
        className="object-cover w-full h-full"
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Dialog open={!!clientSecret} onOpenChange={(open) => !open && setClientSecret(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm
                amount={Number(currentBudget)}
                onSuccess={handleStripeSuccess}
                onError={(msg) => alert(msg)}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>

      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Post Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4">
                <MediaPreview post={post} />
              </div>
              {post.caption && <p className="text-sm text-gray-600 line-clamp-3">{post.caption}</p>}
              <div className="flex gap-4 mt-4 text-sm text-gray-600">
                <span>{post.likes_count || 0} likes</span>
                <span>{post.comments_count || 0} comments</span>
                <span>{post.views_count || 0} views</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {step === "select" && (
            <>
              <div>
                <h1 className="text-3xl font-bold mb-2">Choose Your Package</h1>
                <p className="text-gray-600">Select a promotion budget to boost your content</p>
              </div>

              <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Your Wallet Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">€{walletBalance.toFixed(2)}</div>
                  <p className="text-sm text-gray-300 mt-2">Available for promotions</p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PROMOTION_PACKAGES.map((pkg) => {
                  const pkgEstimates = calculateEstimates(pkg.budget)
                  const isSelected = !isCustomBudget && selectedPackage.id === pkg.id

                  return (
                    <Card
                      key={pkg.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-lg relative",
                        isSelected && "ring-2 ring-blue-500",
                      )}
                      onClick={() => {
                        setIsCustomBudget(false)
                        setSelectedPackage(pkg)
                      }}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Most Popular
                          </Badge>
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{pkg.label}</span>
                          {isSelected && <Check className="w-5 h-5 text-blue-500" />}
                        </CardTitle>
                        <CardDescription>{pkg.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold mb-4">
                          €{pkg.budget}
                          <span className="text-sm font-normal text-gray-500 ml-2">one-time</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-gray-500" />
                            <span>~{pkgEstimates.estimatedViews.toLocaleString()} views</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span>~{pkgEstimates.estimatedProfileVisits.toLocaleString()} profile visits</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-gray-500" />
                            <span>~{pkgEstimates.estimatedNewFollowers} new followers</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <Card className={cn("border-2 transition-all", isCustomBudget && "ring-2 ring-blue-500")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Custom Budget
                  </CardTitle>
                  <CardDescription>Enter your own budget amount for precise control</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="custom-budget">Budget Amount (EUR)</Label>
                    <Input
                      id="custom-budget"
                      type="number"
                      min="5"
                      step="1"
                      placeholder="e.g., 500"
                      value={customBudget}
                      onChange={(e) => {
                        setCustomBudget(e.target.value)
                        setIsCustomBudget(true)
                      }}
                      onFocus={() => setIsCustomBudget(true)}
                      className="text-lg font-semibold"
                    />
                  </div>

                  {isCustomBudget && customBudget && Number.parseFloat(customBudget) >= 5 && (
                    <div className="space-y-2 text-sm bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="font-medium text-blue-900 mb-3">
                        Estimated Results for €{Number.parseFloat(customBudget).toFixed(2)}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-blue-600" />
                            <span>Views</span>
                          </div>
                          <span className="font-semibold text-blue-900">
                            ~{calculateEstimates(Number.parseFloat(customBudget)).estimatedViews.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-green-600" />
                            <span>Profile Visits</span>
                          </div>
                          <span className="font-semibold text-blue-900">
                            ~
                            {calculateEstimates(
                              Number.parseFloat(customBudget),
                            ).estimatedProfileVisits.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-purple-600" />
                            <span>New Followers</span>
                          </div>
                          <span className="font-semibold text-blue-900">
                            ~{calculateEstimates(Number.parseFloat(customBudget)).estimatedNewFollowers}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {isCustomBudget && customBudget && Number.parseFloat(customBudget) < 5 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>Minimum budget is €5</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Button
                onClick={() => setStep("review")}
                size="lg"
                className="w-full"
                disabled={isCustomBudget && (!customBudget || Number.parseFloat(customBudget) < 5)}
              >
                Continue to Review
              </Button>
            </>
          )}

          {step === "review" && (
            <>
              <div>
                <h1 className="text-3xl font-bold mb-2">Review & Confirm</h1>
                <p className="text-gray-600">Double-check your promotion details before payment</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Promotion Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Package</p>
                      <p className="font-semibold">{isCustomBudget ? "Custom Budget" : selectedPackage.label}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Budget</p>
                      <p className="font-semibold">€{currentBudget.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <p className="text-sm font-medium mb-4">Estimated Results</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Eye className="w-5 h-5 text-blue-600" />
                          <span className="text-sm">Views</span>
                        </div>
                        <span className="font-semibold">~{estimates.estimatedViews.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-green-600" />
                          <span className="text-sm">Profile Visits</span>
                        </div>
                        <span className="font-semibold">~{estimates.estimatedProfileVisits.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserPlus className="w-5 h-5 text-purple-600" />
                          <span className="text-sm">New Followers</span>
                        </div>
                        <span className="font-semibold">~{estimates.estimatedNewFollowers}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-medium mb-1">How it works</p>
                        <p>
                          Your promoted post will appear in other users' feeds. Promotion runs until estimated views are
                          delivered.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>Choose how you want to pay for this promotion</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className={cn(
                      "border-2 rounded-lg p-4 cursor-pointer transition-all",
                      paymentMethod === "wallet" ? "border-blue-500 bg-blue-50" : "border-gray-200",
                      !hasSufficientBalance && "opacity-50 cursor-not-allowed",
                    )}
                    onClick={() => hasSufficientBalance && setPaymentMethod("wallet")}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Wallet className="w-5 h-5 mt-0.5 text-blue-600" />
                        <div>
                          <p className="font-semibold">Pay from Wallet Balance</p>
                          <p className="text-sm text-gray-600">Current balance: €{walletBalance.toFixed(2)}</p>
                          {!hasSufficientBalance && (
                            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Insufficient balance. Need €{(currentBudget - walletBalance).toFixed(2)} more.
                            </p>
                          )}
                        </div>
                      </div>
                      {paymentMethod === "wallet" && hasSufficientBalance && (
                        <Check className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </div>

                  <div
                    className={cn(
                      "border-2 rounded-lg p-4 cursor-pointer transition-all",
                      paymentMethod === "card" ? "border-blue-500 bg-blue-50" : "border-gray-200",
                    )}
                    onClick={() => setPaymentMethod("card")}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <CreditCard className="w-5 h-5 mt-0.5 text-blue-600" />
                        <div>
                          <p className="font-semibold">Pay with Card (Stripe)</p>
                          <p className="text-sm text-gray-600">Secure payment via Stripe</p>
                        </div>
                      </div>
                      {paymentMethod === "card" && <Check className="w-5 h-5 text-blue-500" />}
                    </div>
                  </div>

                  {!hasSufficientBalance && paymentMethod === "wallet" && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        You don't have enough balance. Please top up your wallet or pay with card.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep("select")} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleCreatePromotion}
                  disabled={isProcessing || (paymentMethod === "wallet" && !hasSufficientBalance)}
                  className="flex-1"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {paymentMethod === "wallet" ? (
                        <>
                          <Wallet className="mr-2 h-4 w-4" />
                          Pay €{currentBudget.toFixed(2)} from Wallet
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pay €{currentBudget.toFixed(2)} with Card
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
