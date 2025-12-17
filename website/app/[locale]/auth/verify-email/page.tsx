"use client"

import { useSearchParams, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const locale = pathname.split("/")[1] || "en"
  const email = searchParams.get("email") || ""
  const [isResending, setIsResending] = useState(false)
  const [resendStatus, setResendStatus] = useState<"idle" | "success" | "error">("idle")
  const t = useTranslations("common")

  const handleResendEmail = async () => {
    if (!email) return

    setIsResending(true)
    setResendStatus("idle")

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/${locale}/auth/callback?next=/feed`,
        },
      })

      if (error) throw error
      setResendStatus("success")
    } catch (err) {
      console.error("Error resending email:", err)
      setResendStatus("error")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-[#fafbfc] via-[#f5f7fa] to-[#f0f2f5]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#00d4ff]/10">
            <Mail className="h-8 w-8 text-[#00d4ff]" />
          </div>
          <CardTitle className="text-2xl font-bold">{t("verifyEmail.title")}</CardTitle>
          <CardDescription className="text-base">{t("verifyEmail.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {email && (
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">{t("verifyEmail.sentTo")}</p>
              <p className="font-medium text-foreground">{decodeURIComponent(email)}</p>
            </div>
          )}

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>{t("verifyEmail.clickLink")}</p>
            <p>{t("verifyEmail.checkSpam")}</p>
          </div>

          {resendStatus === "success" && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
              <p className="text-sm text-green-700">{t("verifyEmail.resendSuccess")}</p>
            </div>
          )}

          {resendStatus === "error" && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-center">
              <p className="text-sm text-red-700">{t("verifyEmail.resendError")}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={handleResendEmail}
              disabled={isResending || !email}
              className="w-full bg-transparent"
            >
              {isResending ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {t("verifyEmail.resendButton")}
            </Button>

            <Link href={`/${locale}`} className="w-full">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("verifyEmail.backButton")}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
