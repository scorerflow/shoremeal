import type { SupabaseClient } from '@supabase/supabase-js'
import type { Trainer } from '@/types'

export async function getTrainerById(
  db: SupabaseClient,
  trainerId: string
): Promise<Trainer | null> {
  const { data, error } = await db
    .from('trainers')
    .select('*')
    .eq('id', trainerId)
    .single()

  if (error || !data) return null
  return data as Trainer
}

export async function getTrainerForCheckout(
  db: SupabaseClient,
  trainerId: string
): Promise<{ stripe_customer_id: string | null; email: string; full_name: string | null } | null> {
  const { data, error } = await db
    .from('trainers')
    .select('stripe_customer_id, email, full_name')
    .eq('id', trainerId)
    .single()

  if (error || !data) return null
  return data as { stripe_customer_id: string | null; email: string; full_name: string | null }
}

export async function getTrainerStripeId(
  db: SupabaseClient,
  trainerId: string
): Promise<string | null> {
  const { data, error } = await db
    .from('trainers')
    .select('stripe_customer_id')
    .eq('id', trainerId)
    .single()

  if (error || !data) return null
  return data.stripe_customer_id as string | null
}

export async function updateTrainerSubscription(
  db: SupabaseClient,
  trainerId: string,
  updates: Partial<Pick<Trainer,
    'stripe_customer_id' | 'subscription_tier' | 'subscription_status' |
    'plans_used_this_month' | 'billing_cycle_start'
  >>
): Promise<void> {
  const { error } = await db
    .from('trainers')
    .update(updates)
    .eq('id', trainerId)

  if (error) throw new Error(`Failed to update trainer: ${error.message}`)
}

export async function updateStripeCustomerId(
  db: SupabaseClient,
  trainerId: string,
  stripeCustomerId: string
): Promise<void> {
  const { error } = await db
    .from('trainers')
    .update({ stripe_customer_id: stripeCustomerId })
    .eq('id', trainerId)

  if (error) throw new Error(`Failed to update Stripe customer ID: ${error.message}`)
}

export async function incrementPlansUsed(
  db: SupabaseClient,
  trainerId: string
): Promise<void> {
  const { data: trainer } = await db
    .from('trainers')
    .select('plans_used_this_month')
    .eq('id', trainerId)
    .single()

  if (trainer) {
    await db
      .from('trainers')
      .update({ plans_used_this_month: trainer.plans_used_this_month + 1 })
      .eq('id', trainerId)
  }
}
