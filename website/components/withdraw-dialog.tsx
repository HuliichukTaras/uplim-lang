"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowUpRight, AlertCircle, Users } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface WithdrawDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  availableBalance: number
}

const MINIMUM_FOLLOWERS_FOR_WITHDRAWAL = 2500

export function WithdrawDialog({ isOpen, onClose, onSuccess, availableBalance = 0 }: WithdrawDialogProps) {
  const [amount, setAmount] = useState<string>("")
  const [method, setMethod] = useState<string>("bank_transfer")
  const [bankName, setBankName] = useState<string>("")
  const [accountNumber, setAccountNumber] = useState<string>("")
  const [routingNumber, setRoutingNumber] = useState<string>("")
  const [accountHolderName, setAccountHolderName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [followersCount, setFollowersCount] = useState(0)
  const [canWithdraw, setCanWithdraw] = useState(false)

  const supabase = createClient()

  const minWithdrawal = 10
  const maxWithdrawal = Math.min(availableBalance || 0, 50000)

  useEffect(() => {
    const checkFollowersCount = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id)

      const currentFollowers = count || 0
      setFollowersCount(currentFollowers)
      setCanWithdraw(currentFollowers >= MINIMUM_FOLLOWERS_FOR_WITHDRAWAL)
    }

    if (isOpen) {
      checkFollowersCount()
    }
  }, [isOpen, supabase])

  const handleSubmit = async () => {
    setError(null)
    const numAmount = Number.parseFloat(amount)

    if (!canWithdraw) {
      setError(
        `You need at least ${MINIMUM_FOLLOWERS_FOR_WITHDRAWAL.toLocaleString()} followers to withdraw funds. Current: ${followersCount.toLocaleString()}`,
      )
      return
    }

    // Validation
    if (isNaN(numAmount) || numAmount < minWithdrawal) {
      setError(`Minimum withdrawal amount is $${minWithdrawal.toFixed(2)}`)
      return
    }

    if (numAmount > (availableBalance || 0)) {
      setError("Insufficient balance")
      return
    }

    if (method === "bank_transfer") {
      if (!bankName || !accountNumber || !routingNumber || !accountHolderName) {
        setError("Please fill in all bank details")
        return
      }
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/wallet/request-withdrawal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          method: "stripe_connect", // Force Stripe Connect for proper fee handling
          payoutDetails: {
            bankName,
            accountNumber: accountNumber.slice(-4), // Only store last 4 digits
            routingNumber,
            accountHolderName,
          },
        }),
      })

      const data = await response.json()

      if (response.ok) {
        handleClose()
        onSuccess()
      } else {
        setError(data.error || "Failed to submit withdrawal request")
      }
    } catch (error) {
      console.error("[v0] Withdrawal request error:", error)
      setError("Failed to submit withdrawal request. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setAmount("")
    setMethod("bank_transfer")
    setBankName("")
    setAccountNumber("")
    setRoutingNumber("")
    setAccountHolderName("")
    setError(null)
    onClose()
  }

  // Financial breakdown calculations
  const numAmount = Number.parseFloat(amount) || 0
  const platformFee = numAmount * 0.15
  const stripeFee = 0.25
  const netAmount = Math.max(0, numAmount - platformFee - stripeFee)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="neuro-raised max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-[#a855f7]" />
            Withdraw Funds
          </DialogTitle>
          <DialogDescription>
            Request a withdrawal from your wallet. Funds will be processed within 3-5 business days.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!canWithdraw && (
            <Alert variant="destructive">
              <Users className="h-4 w-4" />
              <AlertDescription>
                <strong>Withdrawal locked.</strong> You need {MINIMUM_FOLLOWERS_FOR_WITHDRAWAL.toLocaleString()}{" "}
                followers to withdraw funds.
                <div className="mt-2 w-full bg-red-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((followersCount / MINIMUM_FOLLOWERS_FOR_WITHDRAWAL) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs mt-1 block">
                  {followersCount.toLocaleString()} / {MINIMUM_FOLLOWERS_FOR_WITHDRAWAL.toLocaleString()} followers
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Available Balance Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Available balance: <span className="font-bold text-[#00d4ff]">${(availableBalance || 0).toFixed(2)}</span>
            </AlertDescription>
          </Alert>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="withdraw-amount">Withdrawal Amount</Label>
            <Input
              id="withdraw-amount"
              type="number"
              step="0.01"
              min={minWithdrawal}
              max={maxWithdrawal}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min: $${minWithdrawal}`}
            />
            <p className="text-xs text-gray-500">
              Minimum: ${minWithdrawal.toFixed(2)} • Maximum: ${maxWithdrawal.toFixed(2)}
            </p>
          </div>

          {numAmount > 0 && (
            <div className="bg-gray-50 p-4 rounded-md space-y-2 text-sm neuro-inset">
              <div className="flex justify-between text-gray-700">
                <span>Requested Amount:</span>
                <span className="font-medium">${numAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Platform Fee (15%):</span>
                <span>-${platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Stripe Payout Fee:</span>
                <span>-${stripeFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex justify-between font-bold text-[#00d4ff]">
                <span>You Receive:</span>
                <span>${netAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Withdrawal Method */}
          <div className="space-y-2">
            <Label htmlFor="method">Withdrawal Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="card">Debit Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bank Details */}
          {method === "bank_transfer" && (
            <div className="space-y-3 p-4 rounded-lg neuro-inset">
              <h4 className="font-medium text-sm">Bank Account Details</h4>

              <div className="space-y-2">
                <Label htmlFor="account-holder">Account Holder Name</Label>
                <Input
                  id="account-holder"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank-name">Bank Name</Label>
                <Input
                  id="bank-name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Chase Bank"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-number">Account Number</Label>
                <Input
                  id="account-number"
                  type="password"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="routing-number">Routing Number</Label>
                <Input
                  id="routing-number"
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value)}
                  placeholder="123456789"
                  maxLength={9}
                />
              </div>
            </div>
          )}

          {method === "card" && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Debit card withdrawals are processed instantly but may incur a small fee. Bank transfers are free but
                take 3-5 business days.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleSubmit} disabled={isLoading || !canWithdraw} className="w-full glow-border-purple">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : !canWithdraw ? (
              `Need ${MINIMUM_FOLLOWERS_FOR_WITHDRAWAL.toLocaleString()} Followers`
            ) : (
              `Withdraw $${netAmount.toFixed(2)}`
            )}
          </Button>

          <p className="text-xs text-center text-gray-500">
            Your withdrawal will be reviewed and processed within 3-5 business days
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
