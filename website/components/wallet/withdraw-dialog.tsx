"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Download, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface WithdrawDialogProps {
  isOpen: boolean
  onClose: () => void
  availableBalance: number
  onSuccess: () => void
}

export function WithdrawDialog({ isOpen, onClose, availableBalance, onSuccess }: WithdrawDialogProps) {
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<"stripe_connect" | "bank_transfer">("stripe_connect")
  const [isProcessing, setIsProcessing] = useState(false)
  const [step, setStep] = useState<"amount" | "confirm" | "success">("amount")

  const numericAmount = Number.parseFloat(amount) || 0
  const platformFee = numericAmount * 0.15 // 15%
  const stripeFee = 0.25
  const netAmount = numericAmount - platformFee - stripeFee

  const isValidAmount = numericAmount >= 10 && numericAmount <= availableBalance

  const handleWithdraw = async () => {
    if (!isValidAmount) return

    setIsProcessing(true)
    try {
      const res = await fetch("/api/wallet/request-withdrawal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          method,
          payoutDetails: {},
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setStep("success")
        setTimeout(() => {
          onSuccess()
          resetAndClose()
        }, 2000)
      } else {
        toast.error(data.error || "Failed to process withdrawal")
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsProcessing(false)
    }
  }

  const resetAndClose = () => {
    setStep("amount")
    setAmount("")
    setMethod("stripe_connect")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Withdraw Funds
          </DialogTitle>
          <DialogDescription>Transfer your earnings to your bank account</DialogDescription>
        </DialogHeader>

        {step === "amount" && (
          <div className="space-y-6 py-4">
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
              <p className="text-3xl font-bold">€{availableBalance.toFixed(2)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Withdrawal Amount (EUR)</Label>
              <Input
                id="amount"
                type="number"
                min="10"
                max={availableBalance}
                step="0.01"
                placeholder="Minimum €10.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {numericAmount > 0 && numericAmount < 10 && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Minimum withdrawal is €10.00
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Withdrawal Method</Label>
              <RadioGroup value={method} onValueChange={(v) => setMethod(v as any)}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="stripe_connect" id="stripe" />
                  <Label htmlFor="stripe" className="flex-1 cursor-pointer">
                    <span className="font-medium">Stripe Connect</span>
                    <span className="text-xs text-muted-foreground block">Instant transfer to your bank</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {isValidAmount && (
              <div className="bg-muted/30 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span>€{numericAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Platform Fee (15%)</span>
                  <span>-€{platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Processing Fee</span>
                  <span>-€{stripeFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>You Receive</span>
                  <span className="text-green-600">€{netAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            <Button onClick={() => setStep("confirm")} disabled={!isValidAmount} className="w-full">
              Continue
            </Button>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-6 py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800">
                <strong>Please confirm:</strong> You are withdrawing €{numericAmount.toFixed(2)}
                and will receive €{netAmount.toFixed(2)} after fees.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("amount")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleWithdraw} disabled={isProcessing} className="flex-1">
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Withdrawal"}
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Withdrawal Successful!</h3>
            <p className="text-sm text-muted-foreground">€{netAmount.toFixed(2)} is on its way to your bank account.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
