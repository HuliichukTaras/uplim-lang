export type PromotionPackage = {
  id: string
  budget: number
  estimatedViews: number
  label: string
  description: string
  popular?: boolean
}

export const PROMOTION_PACKAGES: PromotionPackage[] = [
  {
    id: "starter",
    budget: 5,
    estimatedViews: 1650, // 5 * 330
    label: "Starter",
    description: "Perfect to test the waters",
  },
  {
    id: "basic",
    budget: 10,
    estimatedViews: 3300, // 10 * 330
    label: "Growth",
    description: "Boost your reach effectively",
    popular: true,
  },
  {
    id: "popular",
    budget: 15,
    estimatedViews: 4950, // 15 * 330
    label: "Professional",
    description: "For serious content creators",
  },
  {
    id: "premium",
    budget: 25,
    estimatedViews: 8250, // 25 * 330
    label: "Premium",
    description: "Maximum exposure and impact",
  },
]

export const PROMOTION_RATIOS = {
  VIEWS_PER_EUR: 330,
  PROFILE_VISIT_RATE: 0.1,
  FOLLOWER_CONVERSION_RATE: 0.03,
  PROMO_FREQUENCY: 7, // Show 1 promoted post every 7 posts
} as const

export function calculateEstimates(budgetEur: number) {
  const views = Math.round(budgetEur * PROMOTION_RATIOS.VIEWS_PER_EUR)
  const profileVisits = Math.round(views * PROMOTION_RATIOS.PROFILE_VISIT_RATE)
  const newFollowers = Math.round(profileVisits * PROMOTION_RATIOS.FOLLOWER_CONVERSION_RATE)

  return {
    estimatedViews: views,
    estimatedProfileVisits: profileVisits,
    estimatedNewFollowers: newFollowers,
  }
}
