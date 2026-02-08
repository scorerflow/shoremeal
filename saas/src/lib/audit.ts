import { createServiceClient } from '@/lib/supabase/server'

export type AuditAction =
  | 'plan.generation_started'
  | 'plan.generation_completed'
  | 'plan.generation_failed'
  | 'plan.generation_timeout'
  | 'plan.retry_requested'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'subscription.payment_succeeded'
  | 'subscription.payment_failed'
  | 'billing.portal_accessed'
  | 'auth.login'
  | 'auth.signout'

export async function writeAuditLog(params: {
  userId?: string
  action: AuditAction
  resourceType?: string
  resourceId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
}): Promise<void> {
  try {
    const supabase = await createServiceClient()

    await supabase.from('audit_log').insert({
      user_id: params.userId || null,
      action: params.action,
      resource_type: params.resourceType || null,
      resource_id: params.resourceId || null,
      metadata: params.metadata || {},
      ip_address: params.ipAddress || null,
    })
  } catch (error) {
    // Fire-and-forget: never break main flow
    console.error('[audit] Failed to write audit log:', error)
  }
}
