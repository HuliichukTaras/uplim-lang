import { createServiceClient } from "@/lib/supabase/server"
import { getStripeClient } from "@/lib/stripe"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import type Stripe from "stripe"

type SubscriptionLike = Stripe.Subscription | Stripe.Response<Stripe.Subscription>
type PaymentIntentWebhook = Stripe.PaymentIntent & {
  latest_charge?: string | Stripe.Charge | null
  latest_invoice?: string | Stripe.Invoice | null
}

const toIsoOrNull = (value: unknown) => (typeof value === "number" ? new Date(value * 1000).toISOString() : null)

const extractSubscriptionPeriod = (subscription: SubscriptionLike) => {
  const candidate = subscription as Stripe.Subscription & {
    current_period_start?: number | null
    current_period_end?: number | null
    current_period?: {
      start?: number | null
      end?: number | null
    } | null
  }

  const startCandidate = candidate.current_period?.start ?? candidate.current_period_start
  const endCandidate = candidate.current_period?.end ?? candidate.current_period_end

  return {
    current_period_start: toIsoOrNull(startCandidate ?? null),
    current_period_end: toIsoOrNull(endCandidate ?? null),
  }
}

export async function POST(request: Request) {
  let stripeClient: Stripe
  try {
    stripeClient = getStripeClient()
  } catch (configError) {
    console.error("[v0] Stripe configuration error:", configError)
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 })
  }

  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripeClient.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (error) {
    console.error("[v0] Webhook signature verification failed:", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as PaymentIntentWebhook
        const { postId, creatorId, type, promotion_id } = paymentIntent.metadata
        const userId = paymentIntent.metadata.userId || paymentIntent.metadata.user_id

        if (!userId) {
          console.error(
            `[v0] CRITICAL: Payment intent ${paymentIntent.id} succeeded but has NO userId in metadata. Cannot attribute payment to any user. Metadata:`,
            paymentIntent.metadata,
          )
          return NextResponse.json({ error: "Payment intent missing userId in metadata" }, { status: 400 })
        }

        const { data: userProfile, error: userError } = await supabase
          .from("profiles")
          .select("id, email, handle")
          .eq("id", userId)
          .single()

        if (userError || !userProfile) {
          console.error(`[v0] CRITICAL: User ${userId} not found in database. Cannot process payment.`)
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const latestCharge = paymentIntent.latest_charge
        const chargeId = typeof latestCharge === "string" ? latestCharge : latestCharge?.id
        const receiptUrl = latestCharge && typeof latestCharge === "object" ? latestCharge.receipt_url : undefined

        let invoiceData: {
          stripe_invoice_id?: string
          stripe_invoice_pdf_url?: string | null
          invoice_number?: string | null
        } = {}
        if (paymentIntent.latest_invoice) {
          try {
            const invoiceId =
              typeof paymentIntent.latest_invoice === "string"
                ? paymentIntent.latest_invoice
                : paymentIntent.latest_invoice.id
            const invoice = await stripeClient.invoices.retrieve(invoiceId)
            invoiceData = {
              stripe_invoice_id: invoice.id,
              stripe_invoice_pdf_url: invoice.invoice_pdf || invoice.hosted_invoice_url,
              invoice_number: invoice.number,
            }
          } catch (e) {
            console.error("[v0] Failed to fetch invoice in webhook:", e)
          }
        }

        const { data: wallet } = await supabase.from("wallets").select("id").eq("user_id", userId).single()

        if (wallet) {
          const { data: existingTransaction } = await supabase
            .from("wallet_transactions")
            .select("id")
            .eq("wallet_id", wallet.id)
            .contains("metadata", { stripe_payment_intent_id: paymentIntent.id })
            .maybeSingle()

          if (existingTransaction) {
            return NextResponse.json({ received: true, message: "Transaction already processed" })
          }
        }

        if (type === "promotion" && promotion_id) {
          await supabase
            .from("promotions")
            .update({
              status: "active",
              started_at: new Date().toISOString(),
            })
            .eq("id", promotion_id)

          const { data: wallet } = await supabase.from("wallets").select("id").eq("user_id", userId).single()

          if (wallet) {
            await supabase.rpc("record_wallet_transaction", {
              p_wallet_id: wallet.id,
              p_user_id: userId,
              p_amount: paymentIntent.amount / 100,
              p_type: "credit",
              p_category: "top_up",
              p_reference_id: null,
              p_reference_type: "stripe_payment_intent",
              p_description: "Wallet top-up for promotion",
              p_metadata: {
                stripe_payment_intent_id: paymentIntent.id,
                stripe_charge_id: chargeId,
                receipt_url: receiptUrl,
                ...invoiceData,
              },
              p_stripe_invoice_id: invoiceData.stripe_invoice_id || null,
              p_stripe_invoice_pdf_url: invoiceData.stripe_invoice_pdf_url || null,
              p_status: "completed",
            })

            await supabase.rpc("record_wallet_transaction", {
              p_wallet_id: wallet.id,
              p_user_id: userId,
              p_amount: paymentIntent.amount / 100,
              p_type: "debit",
              p_category: "promotion",
              p_reference_id: promotion_id,
              p_reference_type: "promotion",
              p_description: "Payment for promotion",
              p_metadata: {
                promotion_id: promotion_id,
                ...invoiceData,
              },
              p_stripe_invoice_id: invoiceData.stripe_invoice_id || null,
              p_stripe_invoice_pdf_url: invoiceData.stripe_invoice_pdf_url || null,
              p_status: "completed",
            })
          }

          break
        }

        if (type === "wallet_top_up") {
          const { data: wallet } = await supabase.from("wallets").select("id").eq("user_id", userId).single()

          if (wallet) {
            await supabase.rpc("record_wallet_transaction", {
              p_wallet_id: wallet.id,
              p_user_id: userId,
              p_amount: paymentIntent.amount / 100,
              p_type: "credit",
              p_category: "top_up",
              p_reference_id: null,
              p_reference_type: "stripe_payment_intent",
              p_description: "Wallet top-up via Stripe",
              p_metadata: {
                stripe_payment_intent_id: paymentIntent.id,
                stripe_charge_id: chargeId,
                receipt_url: receiptUrl,
                ...invoiceData,
              },
              p_stripe_invoice_id: invoiceData.stripe_invoice_id || null,
              p_stripe_invoice_pdf_url: invoiceData.stripe_invoice_pdf_url || null,
              p_status: "completed",
            })
          }
          break
        }

        await supabase.from("post_unlocks").insert({
          post_id: postId,
          user_id: userId,
        })

        const amountInCents = paymentIntent.amount
        await supabase.rpc("process_earnings_split", {
          p_creator_id: creatorId,
          p_total_amount_cents: amountInCents,
          p_transaction_type: "post_unlock",
          p_reference_id: paymentIntent.id,
        })

        await supabase.from("transactions").insert({
          user_id: userId,
          creator_id: creatorId,
          post_id: postId,
          stripe_payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: "succeeded",
          type: "post_unlock",
        })

        break
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === "subscription") {
          const userId = session.metadata?.userId || session.metadata?.user_id

          if (!userId) {
            console.error(`[v0] Subscription session ${session.id} missing userId in metadata`)
            return NextResponse.json({ error: "Missing userId" }, { status: 400 })
          }

          const { subscriberId, creatorId } = session.metadata!
          const subscription = await stripeClient.subscriptions.retrieve(session.subscription as string)
          const { current_period_start, current_period_end } = extractSubscriptionPeriod(subscription)

          await supabase.from("subscriptions").insert({
            subscriber_id: subscriberId,
            creator_id: creatorId,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            status: subscription.status,
            current_period_start,
            current_period_end,
          })

          const priceInCents = Math.round(subscription.items.data[0]?.price.unit_amount || 0)
          await supabase.rpc("process_earnings_split", {
            p_creator_id: creatorId,
            p_total_amount_cents: priceInCents,
            p_transaction_type: "subscription",
            p_reference_id: subscription.id,
          })
        }
        break
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId || subscription.metadata?.user_id

        if (!userId) {
          console.error(`[v0] Subscription ${subscription.id} missing userId in metadata`)
          return NextResponse.json({ error: "Missing userId" }, { status: 400 })
        }

        const { subscriberId, creatorId } = subscription.metadata!
        const { current_period_start, current_period_end } = extractSubscriptionPeriod(subscription)

        await supabase.from("subscriptions").insert({
          subscriber_id: subscriberId,
          creator_id: creatorId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          status: subscription.status,
          current_period_start,
          current_period_end,
        })

        const priceInCents = Math.round(subscription.items.data[0]?.price.unit_amount || 0)
        await supabase.rpc("process_earnings_split", {
          p_creator_id: creatorId,
          p_total_amount_cents: priceInCents,
          p_transaction_type: "subscription",
          p_reference_id: subscription.id,
        })
        break
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const { current_period_start, current_period_end } = extractSubscriptionPeriod(subscription)

        await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            current_period_start,
            current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id)

        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription }
        const subscriptionId = invoice.subscription

        if (subscriptionId) {
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("creator_id")
            .eq("stripe_subscription_id", subscriptionId)
            .single()

          if (sub) {
            const amountInCents = invoice.amount_paid
            await supabase.rpc("process_earnings_split", {
              p_creator_id: sub.creator_id,
              p_total_amount_cents: amountInCents,
              p_transaction_type: "subscription_renewal",
              p_reference_id: invoice.id,
            })
          }
        }
        break
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account

        const { data: settings } = await supabase
          .from("creator_settings")
          .select("id")
          .eq("stripe_account_id", account.id)
          .single()

        if (settings) {
          await supabase.rpc("sync_stripe_account_status", {
            p_creator_id: settings.id,
            p_stripe_account_id: account.id,
            p_payouts_enabled: account.payouts_enabled || false,
            p_charges_enabled: account.charges_enabled || false,
            p_requirements: account.requirements || {},
            p_disabled_reason: account.requirements?.disabled_reason || null,
          })

          let status = "pending_verification"
          if (account.payouts_enabled && account.charges_enabled && account.details_submitted) {
            status = "verified"
          } else if (account.requirements?.disabled_reason) {
            status = "disabled"
          }

          await supabase
            .from("creator_settings")
            .update({
              stripe_account_status: status,
              updated_at: new Date().toISOString(),
            })
            .eq("id", settings.id)
        }
        break
      }

      case "account.external_account.created":
      case "account.external_account.updated": {
        const externalAccount = event.data.object as Stripe.BankAccount | Stripe.Card

        const { data: settings } = await supabase
          .from("creator_settings")
          .select("id")
          .eq("stripe_account_id", externalAccount.account as string)
          .single()

        if (settings) {
          const stripe = getStripeClient()
          const account = await stripe.accounts.retrieve(externalAccount.account as string)

          await supabase.rpc("sync_stripe_account_status", {
            p_creator_id: settings.id,
            p_stripe_account_id: account.id,
            p_payouts_enabled: account.payouts_enabled || false,
            p_charges_enabled: account.charges_enabled || false,
            p_requirements: account.requirements || {},
            p_disabled_reason: account.requirements?.disabled_reason || null,
          })
        }
        break
      }

      case "identity.verification_session.verified": {
        const session = event.data.object as Stripe.Identity.VerificationSession

        if (session.metadata?.creator_id) {
          await supabase
            .from("creator_verification_status")
            .update({
              identity_verified: true,
              updated_at: new Date().toISOString(),
            })
            .eq("creator_id", session.metadata.creator_id)
        }
        break
      }

      case "identity.verification_session.requires_input": {
        const session = event.data.object as Stripe.Identity.VerificationSession

        if (session.metadata?.creator_id) {
          await supabase
            .from("creator_verification_status")
            .update({
              currently_due: session.last_error ? [session.last_error.code] : [],
              updated_at: new Date().toISOString(),
            })
            .eq("creator_id", session.metadata.creator_id)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Webhook handler error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
