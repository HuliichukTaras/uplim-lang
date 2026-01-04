"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Heart } from 'lucide-react'

export default function DonateDialog({ livestreamId }: { livestreamId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState("")

  async function handleDonate() {
    const donationAmount = parseFloat(amount)
    if (!donationAmount || donationAmount < 1) {
      alert("Please enter a valid amount (minimum $1)")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/livestream/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          livestream_id: livestreamId,
          amount: donationAmount,
          message,
        }),
      })

      const data = await res.json()

      if (res.ok && data.clientSecret) {
        // Here you would integrate Stripe payment form
        alert("Donation successful! (Stripe integration pending)")
        setOpen(false)
        setAmount("")
        setMessage("")
      } else {
        alert(data.error || "Failed to process donation")
      }
    } catch (error) {
      console.error("[v0] Donate error:", error)
      alert("Failed to process donation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2">
          <Heart className="w-4 h-4" />
          Send Donation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send a Donation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="5.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Send an encouraging message..."
              rows={3}
            />
          </div>
          <Button
            onClick={handleDonate}
            disabled={loading || !amount}
            className="w-full"
          >
            {loading ? "Processing..." : `Donate $${amount || "0"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
