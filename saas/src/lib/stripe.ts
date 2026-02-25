import Stripe from 'stripe'
import { APP_CONFIG } from '@/lib/config'
import type { SubscriptionTier } from '@/types'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const PRICE_IDS = {
  starter: APP_CONFIG.stripe.priceIds.starter,
  pro: APP_CONFIG.stripe.priceIds.pro,
  agency: APP_CONFIG.stripe.priceIds.agency,
} as const

export type PriceTier = keyof typeof PRICE_IDS

/**
 * Reverse-lookup: given a Stripe price ID, return the matching subscription tier.
 * Returns null if the price ID doesn't match any known tier.
 */
export function getTierFromPriceId(priceId: string): SubscriptionTier | null {
  for (const [tier, id] of Object.entries(PRICE_IDS)) {
    if (id === priceId) {
      return tier as SubscriptionTier
    }
  }
  return null
}

export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
}: {
  customerId?: string
  priceId: string
  successUrl: string
  cancelUrl: string
}) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
  })

  return session
}

export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

export async function createCustomer(email: string, name?: string) {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      source: 'forzafed_pro',
    },
  })

  return customer
}

export async function getSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  return subscription
}
