import type { SupabaseClient } from '@supabase/supabase-js'
import { stripe, PRICE_IDS, createCustomer, createCustomerPortalSession } from '@/lib/stripe'
import type { PriceTier } from '@/lib/stripe'
import { getTrainerForCheckout, getTrainerStripeId, updateStripeCustomerId } from '@/lib/repositories/trainers'
import { writeAuditLog } from '@/lib/audit'
import { AppError } from '@/lib/errors'

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
    success_url: `${process.env.NEXT_PUBLIC_APP_URL?.trim()}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL?.trim()}/pricing?cancelled=true`,
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
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
  )

  writeAuditLog({
    userId,
    action: 'billing.portal_accessed',
    resourceType: 'billing',
    ipAddress: ip,
  })

  return { url: session.url }
}
