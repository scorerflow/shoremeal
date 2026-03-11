import type { SupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { stripe, PRICE_IDS, createCustomer, createCustomerPortalSession, getTierFromPriceId } from '@/lib/stripe'
import type { PriceTier } from '@/lib/stripe'
import { getTrainerForCheckout, getTrainerStripeId, updateStripeCustomerId, updateTrainerSubscription } from '@/lib/repositories/trainers'
import { writeAuditLog } from '@/lib/audit'
import { AppError } from '@/lib/errors'
import { APP_CONFIG } from '@/lib/config'
import type { SubscriptionTier } from '@/types'

export async function initiateCheckout(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string,
  tier: string
) {
  if (!PRICE_IDS[tier as PriceTier]) {
    throw new AppError('Invalid tier', 'VALIDATION_ERROR', 400)
  }

  const trainer = await getTrainerForCheckout(supabase, userId)
  let customerId = trainer?.stripe_customer_id || null

  if (!customerId) {
    const customer = await createCustomer(
      trainer?.email || userEmail,
      trainer?.full_name || undefined
    )
    customerId = customer.id
    await updateStripeCustomerId(supabase, userId, customerId)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: PRICE_IDS[tier as PriceTier],
        quantity: 1,
      },
    ],
    success_url: `${APP_CONFIG.appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_CONFIG.appUrl}/pricing?cancelled=true`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: {
        trainer_id: userId,
        tier,
      },
    },
  })

  return { url: session.url }
}

/**
 * Maps Stripe subscription status to our internal status.
 * Single source of truth — used by webhook handlers and checkout verification.
 */
type SubscriptionStatus = 'active' | 'cancelled' | 'past_due'

export function mapStripeSubscriptionStatus(
  stripeStatus: Stripe.Subscription.Status
): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
      return 'past_due'
    case 'canceled':
    case 'unpaid':
      return 'cancelled'
    default:
      return 'active'
  }
}

/**
 * Derives subscription tier from a Stripe subscription.
 * Single source of truth — price ID is authoritative, metadata is fallback.
 */
export function deriveTierFromSubscription(subscription: Stripe.Subscription): SubscriptionTier {
  const priceId = subscription.items?.data?.[0]?.price?.id
  return (priceId && getTierFromPriceId(priceId))
    || (subscription.metadata.tier as SubscriptionTier)
    || 'starter'
}

/**
 * Syncs a completed checkout session to the database.
 * Called by both the webhook handler (async) and checkout verify endpoint (immediate).
 * Idempotent — safe to call multiple times for the same session.
 */
export async function syncCheckoutToDatabase(
  db: SupabaseClient,
  session: Stripe.Checkout.Session
): Promise<{ trainerId: string; tier: SubscriptionTier; status: string }> {
  if (!session.subscription) {
    throw new AppError('No subscription in checkout session', 'VALIDATION_ERROR', 400)
  }

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  )

  const trainerId = subscription.metadata.trainer_id
  if (!trainerId) {
    throw new AppError('No trainer ID in subscription metadata', 'VALIDATION_ERROR', 400)
  }

  const tier = deriveTierFromSubscription(subscription)
  const status = mapStripeSubscriptionStatus(subscription.status)

  await updateTrainerSubscription(db, trainerId, {
    stripe_customer_id: session.customer as string,
    subscription_tier: tier,
    subscription_status: status,
    billing_cycle_start: new Date().toISOString(),
    plans_used_this_month: 0,
  })

  writeAuditLog({
    userId: trainerId,
    action: 'subscription.created',
    resourceType: 'subscription',
    resourceId: session.subscription as string,
    metadata: { tier, customerId: session.customer },
  })

  return { trainerId, tier, status }
}

export async function createBillingPortal(
  supabase: SupabaseClient,
  userId: string,
  ip: string
) {
  const stripeCustomerId = await getTrainerStripeId(supabase, userId)

  if (!stripeCustomerId) {
    throw new AppError('No active subscription', 'SUBSCRIPTION_REQUIRED', 400)
  }

  const session = await createCustomerPortalSession(
    stripeCustomerId,
    `${APP_CONFIG.appUrl}/dashboard`
  )

  writeAuditLog({
    userId,
    action: 'billing.portal_accessed',
    resourceType: 'billing',
    ipAddress: ip,
  })

  return { url: session.url }
}
