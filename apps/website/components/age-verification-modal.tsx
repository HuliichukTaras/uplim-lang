"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle } from "lucide-react"

export function AgeVerificationModal({
  isOpen,
  onClose,
  onVerified,
}: {
  isOpen: boolean
  onClose: () => void
  onVerified: () => void
}) {
  const [agreed, setAgreed] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const supabase = createClient()

  if (!isOpen) return null

  const handleVerify = async () => {
    if (!agreed) return

    setIsVerifying(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      await supabase
        .from("profiles")
        .update({
          age_verified: true,
          age_verified_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      onVerified()
    }

    setIsVerifying(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-8 neuro-raised">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center mb-4">Age Verification Required</h2>

        <p className="text-gray-600 text-center mb-6">
          This content is marked as 18+ or sensitive. To view this content, you must confirm that you are at least 18
          years old.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-700 mb-3">By verifying your age, you confirm that:</p>
          <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
            <li>You are at least 18 years of age</li>
            <li>You understand this content may be sensitive or explicit</li>
            <li>You comply with your local laws regarding adult content</li>
            <li>You will not share this content with minors</li>
          </ul>
        </div>

        <div className="flex items-start gap-3 mb-6">
          <Checkbox id="age-agree" checked={agreed} onCheckedChange={(checked) => setAgreed(checked === true)} />
          <label htmlFor="age-agree" className="text-sm text-gray-700 cursor-pointer">
            I confirm that I am 18 years or older and agree to view age-restricted content
          </label>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
            Cancel
          </Button>
          <Button onClick={handleVerify} disabled={!agreed || isVerifying} className="flex-1 glow-border-cyan">
            {isVerifying ? "Verifying..." : "Verify Age"}
          </Button>
        </div>
      </div>
    </div>
  )
}
