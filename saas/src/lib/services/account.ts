import type { SupabaseClient } from '@supabase/supabase-js'
import { getTrainerStripeId } from '@/lib/repositories/trainers'
import { cancelAllSubscriptions } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit'
import { AppError } from '@/lib/errors'

export async function deleteAccount(
  supabase: SupabaseClient,
  userId: string,
  ip: string
): Promise<void> {
  // 1. Fetch Stripe customer ID (if any)
  const stripeCustomerId = await getTrainerStripeId(supabase, userId)

  // 2. Cancel all active Stripe subscriptions before deleting data
  if (stripeCustomerId) {
    await cancelAllSubscriptions(stripeCustomerId)
  }

  // 3. Audit log BEFORE deletion (user record won't exist after)
  await writeAuditLog({
    userId,
    action: 'account.deleted',
    resourceType: 'account',
    resourceId: userId,
    metadata: {
      hadStripeCustomer: !!stripeCustomerId,
    },
    ipAddress: ip,
  })

  // 4. Delete auth user via service role — cascades all DB data
  const serviceClient = await createServiceClient()
  const { error } = await serviceClient.auth.admin.deleteUser(userId)

  if (error) {
    throw new AppError(
      'Failed to delete account. Please try again or contact support.',
      'INTERNAL_ERROR',
      500
    )
  }
}
