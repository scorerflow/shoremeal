import type { SupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { updateTrainerSubscription } from '@/lib/repositories/trainers'
import { writeAuditLog } from '@/lib/audit'
import type { SubscriptionTier } from '@/types'

export async function handleCheckoutCompleted(
  db: SupabaseClient,
  session: Stripe.Checkout.Session
) {
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  )
  const tier = (subscription.metadata.tier || 'starter') as SubscriptionTier
  const trainerId = subscription.metadata.trainer_id

  await updateTrainerSubscription(db, trainerId, {
    stripe_customer_id: session.customer as string,
    subscription_tier: tier,
    subscription_status: 'active',
    billing_cycle_start: new Date().toISOString(),
    plans_used_this_month: 0,
  })

  await writeAuditLog({
    userId: trainerId,
    action: 'subscription.created',
    resourceType: 'subscription',
    resourceId: session.subscription as string,
    metadata: { tier, customerId: session.customer },
  })
}

export async function handleSubscriptionUpdated(
  db: SupabaseClient,
  subscription: Stripe.Subscription
) {
  const trainerId = subscription.metadata.trainer_id
  if (!trainerId) return

  const tier = (subscription.metadata.tier || 'starter') as SubscriptionTier
  const status = subscription.status === 'active' ? 'active' :
                subscription.status === 'past_due' ? 'past_due' :
                subscription.status === 'canceled' ? 'cancelled' : 'active'

  await updateTrainerSubscription(db, trainerId, {
    subscription_tier: tier,
    subscription_status: status,
  })

  await writeAuditLog({
    userId: trainerId,
    action: 'subscription.updated',
    resourceType: 'subscription',
    resourceId: subscription.id,
    metadata: { tier, status },
  })
}

export async function handleSubscriptionDeleted(
  db: SupabaseClient,
  subscription: Stripe.Subscription
) {
  const trainerId = subscription.metadata.trainer_id
  if (!trainerId) return

  await updateTrainerSubscription(db, trainerId, {
    subscription_tier: null,
    subscription_status: 'cancelled',
  })

  await writeAuditLog({
    userId: trainerId,
    action: 'subscription.cancelled',
    resourceType: 'subscription',
    resourceId: subscription.id,
  })
}

export async function handlePaymentSucceeded(
  db: SupabaseClient,
  invoice: Stripe.Invoice
) {
  if (invoice.billing_reason !== 'subscription_cycle') return

  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  )
  const trainerId = subscription.metadata.trainer_id
  if (!trainerId) return

  await updateTrainerSubscription(db, trainerId, {
    plans_used_this_month: 0,
    billing_cycle_start: new Date().toISOString(),
  })

  await writeAuditLog({
    userId: trainerId,
    action: 'subscription.payment_succeeded',
    resourceType: 'invoice',
    resourceId: invoice.id,
  })
}

export async function handlePaymentFailed(
  db: SupabaseClient,
  invoice: Stripe.Invoice
) {
  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  )
  const trainerId = subscription.metadata.trainer_id
  if (!trainerId) return

  await updateTrainerSubscription(db, trainerId, {
    subscription_status: 'past_due',
  })

  await writeAuditLog({
    userId: trainerId,
    action: 'subscription.payment_failed',
    resourceType: 'invoice',
    resourceId: invoice.id,
  })
}

// eslint-disable-next-line
export const WEBHOOK_HANDLERS: Record<string, (db: SupabaseClient, data: any) => Promise<void>> = {
  'checkout.session.completed': (db, data) => handleCheckoutCompleted(db, data as Stripe.Checkout.Session),
  'customer.subscription.updated': (db, data) => handleSubscriptionUpdated(db, data as Stripe.Subscription),
  'customer.subscription.deleted': (db, data) => handleSubscriptionDeleted(db, data as Stripe.Subscription),
  'invoice.payment_succeeded': (db, data) => handlePaymentSucceeded(db, data as Stripe.Invoice),
  'invoice.payment_failed': (db, data) => handlePaymentFailed(db, data as Stripe.Invoice),
}
