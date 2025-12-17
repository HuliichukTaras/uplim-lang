"use client"

import type React from "react"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, AddressElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Coins } from "lucide-react"
import { calculateTopUpTotal, WALLET_PACKAGES } from "@/lib/wallet"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function PaymentForm({ details, onSuccess }: { details: any; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsProcessing(true)
    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/wallet` },
      redirect: "if_required",
    })

    if (submitError) {
      setError(submitError.message || "Payment failed")
      setIsProcessing(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-xl space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Coins Package</span>
          <span className="font-semibold">{details.coins} COINS</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Package Price</span>
          <span>€{details.package.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Transaction Fee (+10%)</span>
          <span>€{details.fee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-t pt-2 font-bold text-base">
          <span>Total to Pay</span>
          <span>€{details.total.toFixed(2)}</span>
        </div>
        <p className="text-xs text-muted-foreground italic mt-2">
          * Final price will include applicable VAT/Tax based on your location.
        </p>
      </div>

      <div className="space-y-4">
        {/* Collect address for tax calculation */}
        <AddressElement options={{ mode: "billing" }} />
        <PaymentElement />
      </div>

      {error && <p className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded-lg">{error}</p>}

      <Button type="submit" disabled={!stripe || isProcessing} className="w-full h-12 text-lg font-bold">
        {isProcessing ? <Loader2 className="animate-spin mr-2" /> : `Pay €${details.total.toFixed(2)}`}
      </Button>
    </form>
  )
}

export function TopUpDialog({
  isOpen,
  onClose,
  onSuccess,
}: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  const [step, setStep] = useState<"package" | "payment">("package")
  const [isLoading, setIsLoading] = useState(false)

  const handlePackageSelect = async (amount: number) => {
    setSelectedPackage(amount)
    setIsLoading(true)
    try {
      const res = await fetch("/api/stripe/create-top-up-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      })
      const data = await res.json()

      if (data.clientSecret) {
        setClientSecret(data.clientSecret)
        setPaymentDetails(data.details)
        setStep("payment")
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setStep("package")
    setClientSecret(null)
    setSelectedPackage(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={reset}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Coins className="w-6 h-6 text-amber-500" />
            {step === "package" ? "Select Coin Package" : "Confirm Payment"}
          </DialogTitle>
          <DialogDescription>1 EUR = 10 COINS. Use coins to unlock content instantly.</DialogDescription>
        </DialogHeader>

        {step === "package" ? (
          <div className="grid grid-cols-2 gap-3 py-4">
            {WALLET_PACKAGES.map((pkg) => {
              const { coins, total } = calculateTopUpTotal(pkg)
              return (
                <button
                  key={pkg}
                  onClick={() => handlePackageSelect(pkg)}
                  disabled={isLoading}
                  className="flex flex-col items-center p-4 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group relative overflow-hidden"
                >
                  <div className="text-2xl font-black text-amber-500 mb-1 group-hover:scale-110 transition-transform">
                    {coins}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">COINS</div>
                  <div className="mt-2 text-sm font-medium bg-foreground/5 px-3 py-1 rounded-full">
                    €{total.toFixed(2)}
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm
                details={paymentDetails}
                onSuccess={() => {
                  reset()
                  onSuccess()
                }}
              />
            </Elements>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}
