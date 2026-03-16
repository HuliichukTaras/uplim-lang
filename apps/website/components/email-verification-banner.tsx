"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { X, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EmailVerificationBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  useEffect(() => {
    const checkEmailVerification = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Show banner if user exists but email is not confirmed
      if (user && !user.email_confirmed_at) {
        setIsVisible(true)
      }
    }

    checkEmailVerification()
  }, [])

  const handleResendEmail = async () => {
    setIsResending(true)
    setResendMessage(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user?.email) {
        setResendMessage("Unable to resend email")
        return
      }

      // Resend verification email
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
      })

      if (error) throw error

      setResendMessage("Verification email sent! Check your inbox.")
    } catch (error) {
      setResendMessage("Failed to resend email. Please try again.")
      console.error("[v0] Error resending verification email:", error)
    } finally {
      setIsResending(false)
    }
  }

  if (!isVisible) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Mail className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-900">
              <span className="font-medium">Please verify your email address</span> to unlock all features.
            </p>
            {resendMessage && <p className="text-xs text-amber-700 mt-1">{resendMessage}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResendEmail}
            disabled={isResending}
            className="text-amber-900 hover:text-amber-950 hover:bg-amber-100"
          >
            {isResending ? "Sending..." : "Resend email"}
          </Button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-amber-600 hover:text-amber-900 p-1 rounded-md hover:bg-amber-100 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
