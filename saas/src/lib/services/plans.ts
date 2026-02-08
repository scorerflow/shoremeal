import type { SupabaseClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/server'
import { getTrainerById } from '@/lib/repositories/trainers'
import { createClient as createClientRecord } from '@/lib/repositories/clients'
import { createPlan, getPlanWithClient } from '@/lib/repositories/plans'
import { getBrandingColours } from '@/lib/repositories/branding'
import { inngest } from '@/lib/inngest/client'
import { writeAuditLog } from '@/lib/audit'
import { AppError } from '@/lib/errors'
import { TIERS, type SubscriptionTier } from '@/types'
import type { ValidatedPlanInput } from '@/lib/validation'
import { generatePlanPdf } from '@/lib/pdf/generate'
import { APP_CONFIG } from '@/lib/config'

export async function requestPlanGeneration(
  supabase: SupabaseClient,
  userId: string,
  formData: ValidatedPlanInput,
  ip: string
) {
  const trainer = await getTrainerById(supabase, userId)

  if (!trainer?.subscription_tier || trainer.subscription_status !== 'active') {
    throw new AppError('Active subscription required', 'SUBSCRIPTION_REQUIRED', 403)
  }

  const tier = trainer.subscription_tier as SubscriptionTier
  const limit = TIERS[tier].plansPerMonth

  if (trainer.plans_used_this_month >= limit) {
    throw new AppError(`Monthly plan limit reached (${limit} plans)`, 'PLAN_LIMIT_REACHED', 403)
  }

  const client = await createClientRecord(supabase, {
    trainer_id: userId,
    name: formData.name,
    form_data: formData as unknown as Record<string, unknown>,
  })

  // Service client for plan creation (bypasses RLS for nullable fields)
  const serviceDb = await createServiceClient()
  const plan = await createPlan(serviceDb, {
    client_id: client.id,
    trainer_id: userId,
    status: 'pending',
  })

  await inngest.send({
    name: 'plan/generate.requested',
    data: {
      planId: plan.id,
      clientId: client.id,
      trainerId: userId,
      formData: formData as unknown as Record<string, unknown>,
      businessName: trainer.business_name || undefined,
    },
  })

  writeAuditLog({
    userId,
    action: 'plan.generation_started',
    resourceType: 'plan',
    resourceId: plan.id,
    metadata: { clientId: client.id, tier },
    ipAddress: ip,
  })

  return { plan_id: plan.id, client_id: client.id, status: 'pending' as const }
}

export async function getPlanStatusData(
  supabase: SupabaseClient,
  planId: string,
  userId: string | null
) {
  const plan = await getPlanWithClient(supabase, planId, userId || undefined)

  if (!plan) {
    throw new AppError('Plan not found', 'FORBIDDEN', 404)
  }

  const clientData = plan.clients
  const response: Record<string, unknown> = {
    id: plan.id,
    status: plan.status,
    created_at: plan.created_at,
    updated_at: plan.updated_at,
    client_name: clientData?.name || null,
  }

  if (plan.status === 'completed' && plan.plan_text) {
    response.plan_text = plan.plan_text
  }

  return response
}

export async function generatePlanPdfForExport(
  supabase: SupabaseClient,
  planId: string,
  userId: string | null
) {
  const plan = await getPlanWithClient(supabase, planId, userId || undefined)

  if (!plan) {
    throw new AppError('Plan not found', 'FORBIDDEN', 404)
  }

  if (plan.status !== 'completed' || !plan.plan_text) {
    throw new AppError('Plan is not ready for export', 'VALIDATION_ERROR', 400)
  }

  const clientName = plan.clients?.name || 'Client'
  const trainerId = plan.trainer_id

  // Fetch trainer + branding in parallel
  const [trainer, branding] = await Promise.all([
    getTrainerById(supabase, trainerId),
    getBrandingColours(supabase, trainerId),
  ])

  const trainerName = trainer?.full_name || trainer?.business_name || 'Your Trainer'
  const businessName = trainer?.business_name || trainerName

  const colours = {
    primary: branding?.primary_colour || APP_CONFIG.defaults.branding.primary,
    secondary: branding?.secondary_colour || APP_CONFIG.defaults.branding.secondary,
    accent: branding?.accent_colour || APP_CONFIG.defaults.branding.accent,
  }

  const pdfBuffer = await generatePlanPdf({
    planText: plan.plan_text,
    clientName,
    trainerName,
    businessName,
    colours,
    createdAt: plan.created_at,
  })

  return { pdfBuffer, clientName }
}
