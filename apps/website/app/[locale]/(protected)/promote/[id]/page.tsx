import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { PromotionDetails } from "@/components/promote/promotion-details"
import { getPromotionById, getPromotionImpressions } from "@/lib/promotions/promotion-service"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Promotion Details | Fantikx",
  description: "View your promotion performance and analytics",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function PromotionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (id === "create") {
    redirect("/promote")
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  try {
    const promotion = await getPromotionById(id)

    if (!promotion || promotion.user_id !== user.id) {
      redirect("/promote")
    }

    const impressions = await getPromotionImpressions(id)

    return <PromotionDetails promotion={promotion} impressions={impressions} />
  } catch (error) {
    console.error("Error loading promotion:", error)
    notFound()
  }
}
