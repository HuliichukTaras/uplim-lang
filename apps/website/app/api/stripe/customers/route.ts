import type Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"

import { getStripeClient } from "@/lib/stripe"

const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100

type CustomersResponse = {
  customers: Stripe.Customer[]
  hasMore: boolean
  nextCursor: string | null
}

/**
 * Normalizes the requested page size to stay within a safe range.
 */
const sanitizeLimit = (value: string | null): number => {
  if (!value) return DEFAULT_LIMIT
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT
  }

  return Math.min(parsed, MAX_LIMIT)
}

/**
 * Fetches a paginated list of Stripe customers with optional email filtering.
 */
export async function GET(request: NextRequest) {
  let stripeClient: ReturnType<typeof getStripeClient>

  try {
    stripeClient = getStripeClient()
  } catch (error) {
    console.error("[stripe] configuration error", error)
    return NextResponse.json(
      {
        error: "Stripe is not configured",
      },
      { status: 500 },
    )
  }

  const { searchParams } = new URL(request.url)
  const limit = sanitizeLimit(searchParams.get("limit"))
  const email = searchParams.get("email") ?? undefined
  const startingAfter = searchParams.get("starting_after") ?? undefined

  try {
    const customers = await stripeClient.customers.list({
      limit,
      email,
      starting_after: startingAfter,
    })

    const payload: CustomersResponse = {
      customers: customers.data,
      hasMore: customers.has_more,
      nextCursor: customers.data.at(-1)?.id ?? null,
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error("[stripe] Failed to list customers", error)
    return NextResponse.json(
      {
        error: "Unable to fetch customers",
      },
      { status: 500 },
    )
  }
}
