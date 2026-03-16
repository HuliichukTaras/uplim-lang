"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, AlertCircle, Loader2, ShieldCheck, FileText } from 'lucide-react'

interface VerificationStatus {
  identity_verified: boolean
  tax_verified: boolean
  payouts_enabled: boolean
  charges_enabled: boolean
  currently_due: string[]
  eventually_due: string[]
  past_due: string[]
  disabled_reason: string | null
}

export function VerificationPanel({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [verification, setVerification] = useState<VerificationStatus | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)

  useEffect(() => {
    fetchVerificationStatus()
  }, [])

  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch("/api/stripe/connect/account-status")
      if (response.ok) {
        const data = await response.json()
        setVerification(data.verification)
        setAccountId(data.account.id)
      }
    } catch (error) {
      console.error("[v0] Error fetching verification:", error)
    } finally {
      setLoading(false)
    }
  }

  const createStripeAccount = async () => {
    setCreating(true)
    try {
      const response = await fetch("/api/stripe/connect/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: "US", email: "" }),
      })

      if (response.ok) {
        const data = await response.json()
        setAccountId(data.accountId)
        await startOnboarding(data.accountId)
      }
    } catch (error) {
      console.error("[v0] Error creating account:", error)
    } finally {
      setCreating(false)
    }
  }

  const startOnboarding = async (stripeAccountId?: string) => {
    try {
      const response = await fetch("/api/stripe/connect/onboarding-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: stripeAccountId || accountId }),
      })

      if (response.ok) {
        const data = await response.json()
        window.location.href = data.url
      }
    } catch (error) {
      console.error("[v0] Error starting onboarding:", error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!accountId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Identity & Tax Verification
          </CardTitle>
          <CardDescription>Complete verification to enable payouts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            To withdraw earnings, you must complete identity verification and provide tax information. This is handled
            securely by Stripe.
          </p>
          <Button onClick={createStripeAccount} disabled={creating} className="w-full">
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Start Verification Process"
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = (verified: boolean) => {
    return verified ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-muted-foreground" />
    )
  }

  const allVerified = verification?.identity_verified && verification?.tax_verified && verification?.payouts_enabled

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Identity Verification
          </CardTitle>
          <CardDescription>Verify your identity to receive payouts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(verification?.identity_verified || false)}
              <div>
                <p className="font-medium">Identity Verified</p>
                <p className="text-sm text-muted-foreground">Government ID and selfie check</p>
              </div>
            </div>
            {verification?.identity_verified ? (
              <Badge variant="default">Verified</Badge>
            ) : (
              <Badge variant="secondary">Pending</Badge>
            )}
          </div>

          {!verification?.identity_verified && (
            <Button onClick={() => startOnboarding()} className="w-full">
              Complete Identity Verification
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Tax Information
          </CardTitle>
          <CardDescription>Provide tax details for compliance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(verification?.tax_verified || false)}
              <div>
                <p className="font-medium">Tax Information</p>
                <p className="text-sm text-muted-foreground">Tax ID and payout details</p>
              </div>
            </div>
            {verification?.tax_verified ? (
              <Badge variant="default">Verified</Badge>
            ) : (
              <Badge variant="secondary">Pending</Badge>
            )}
          </div>

          {!verification?.tax_verified && (
            <Button onClick={() => startOnboarding()} className="w-full">
              Complete Tax Information
            </Button>
          )}
        </CardContent>
      </Card>

      {verification?.currently_due && verification.currently_due.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-5 w-5" />
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Additional information is required to complete your verification.
            </p>
            <Button onClick={() => startOnboarding()} variant="outline" className="w-full">
              Complete Requirements
            </Button>
          </CardContent>
        </Card>
      )}

      {allVerified && (
        <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">Verification Complete</p>
              <p className="text-sm text-green-600 dark:text-green-500">You can now receive payouts</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
