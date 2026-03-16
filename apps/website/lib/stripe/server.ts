import { getStripeClient } from "./index"

export async function createPaymentIntent(params: {
  amount: number
  currency?: string
  metadata?: Record<string, string>
}) {
  const stripe = getStripeClient()

  return await stripe.paymentIntents.create({
    amount: Math.round(params.amount * 100), // Convert to cents
    currency: params.currency || "usd",
    metadata: params.metadata || {},
    automatic_payment_methods: {
      enabled: true,
    },
  })
}

export async function createConnectedAccount(email: string, country = "US") {
  const stripe = getStripeClient()

  return await stripe.accounts.create({
    type: "express",
    email,
    country,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: "individual",
  })
}

export async function createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
  const stripe = getStripeClient()

  return await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  })
}

export async function getAccountStatus(accountId: string) {
  const stripe = getStripeClient()

  const account = await stripe.accounts.retrieve(accountId)

  return {
    id: account.id,
    payouts_enabled: account.payouts_enabled,
    charges_enabled: account.charges_enabled,
    details_submitted: account.details_submitted,
    requirements: account.requirements,
  }
}

export { getStripeClient }
