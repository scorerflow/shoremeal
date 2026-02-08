import type { SupabaseClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/server'
import { getTrainerById } from '@/lib/repositories/trainers'
import { createClient as createClientRecord, getClientById } from '@/lib/repositories/clients'
import { createPlan, getPlanWithClient, updatePlanStatus } from '@/lib/repositories/plans'
import { getBrandingColours } from '@/lib/repositories/branding'
import { inngest } from '@/lib/inngest/client'
import { writeAuditLog } from '@/lib/audit'
import { AppError } from '@/lib/errors'
import { TIERS, type SubscriptionTier } from '@/types'
import type { ValidatedPlanInput } from '@/lib/validation'
import { generatePlanPdf } from '@/lib/pdf/generate'
import { APP_CONFIG } from '@/lib/config'
import { DEV_TRAINER } from '@/lib/dev-fixtures'

export async function requestPlanGeneration(
  supabase: SupabaseClient,
  userId: string,
  formData: ValidatedPlanInput,
  ip: string
) {
  const DEV_MODE = process.env.DEV_MODE === 'true'

  // In DEV_MODE, skip subscription check and use mock trainer
  let businessName: string | undefined
  let tier: SubscriptionTier

  if (DEV_MODE) {
    businessName = DEV_TRAINER.business_name
    tier = DEV_TRAINER.subscription_tier
  } else {
    const trainer = await getTrainerById(supabase, userId)

    if (!trainer?.subscription_tier || trainer.subscription_status !== 'active') {
      throw new AppError('Active subscription required', 'SUBSCRIPTION_REQUIRED', 403)
    }

    tier = trainer.subscription_tier as SubscriptionTier
    const limit = TIERS[tier].plansPerMonth

    if (trainer.plans_used_this_month >= limit) {
      throw new AppError(`Monthly plan limit reached (${limit} plans)`, 'PLAN_LIMIT_REACHED', 403)
    }

    businessName = trainer.business_name || undefined
  }

  let client
  let clientId: string

  // If clientId is provided, use the existing client; otherwise create a new one
  if (formData.clientId) {
    const existingClient = await getClientById(supabase, formData.clientId)

    if (!existingClient || existingClient.trainer_id !== userId) {
      throw new AppError('Client not found', 'FORBIDDEN', 404)
    }

    client = existingClient
    clientId = existingClient.id
  } else {
    client = await createClientRecord(supabase, {
      trainer_id: userId,
      name: formData.name,
      form_data: formData as unknown as Record<string, unknown>,
    })
    clientId = client.id
  }

  // Service client for plan creation (bypasses RLS for nullable fields)
  const serviceDb = await createServiceClient()
  const plan = await createPlan(serviceDb, {
    client_id: clientId,
    trainer_id: userId,
    status: 'pending',
  })

  await inngest.send({
    name: 'plan/generate.requested',
    data: {
      planId: plan.id,
      clientId: clientId,
      trainerId: userId,
      formData: formData as unknown as Record<string, unknown>,
      businessName,
    },
  })

  writeAuditLog({
    userId,
    action: 'plan.generation_started',
    resourceType: 'plan',
    resourceId: plan.id,
    metadata: { clientId: clientId, tier, reusingExisting: !!formData.clientId },
    ipAddress: ip,
  })

  return { plan_id: plan.id, client_id: clientId, status: 'pending' as const }
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

  // Check for stale plan - if generating for more than configured timeout, mark as failed
  if (plan.status === 'generating') {
    const updatedAt = new Date(plan.updated_at)
    const now = new Date()
    const minutesElapsed = (now.getTime() - updatedAt.getTime()) / 1000 / 60

    if (minutesElapsed > APP_CONFIG.planTimeout.staleMinutes) {
      const serviceDb = await createServiceClient()
      await updatePlanStatus(serviceDb, planId, {
        status: 'failed',
        error_message: `Plan generation timed out after ${APP_CONFIG.planTimeout.staleMinutes} minutes`,
      })

      writeAuditLog({
        userId: plan.trainer_id,
        action: 'plan.generation_timeout',
        resourceType: 'plan',
        resourceId: planId,
        metadata: { minutesElapsed: Math.round(minutesElapsed) },
      })

      // Update local plan object to reflect the change
      plan.status = 'failed'
    }
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
  const DEV_MODE = process.env.DEV_MODE === 'true'

  let trainerName: string
  let businessName: string
  let colours: { primary: string; secondary: string; accent: string }

  if (DEV_MODE) {
    // Use mock trainer and branding data in DEV_MODE
    trainerName = DEV_TRAINER.full_name
    businessName = DEV_TRAINER.business_name
    colours = {
      primary: APP_CONFIG.defaults.branding.primary,
      secondary: APP_CONFIG.defaults.branding.secondary,
      accent: APP_CONFIG.defaults.branding.accent,
    }
  } else {
    // Fetch trainer + branding in parallel
    const [trainer, branding] = await Promise.all([
      getTrainerById(supabase, trainerId),
      getBrandingColours(supabase, trainerId),
    ])

    trainerName = trainer?.full_name || trainer?.business_name || 'Your Trainer'
    businessName = trainer?.business_name || trainerName

    colours = {
      primary: branding?.primary_colour || APP_CONFIG.defaults.branding.primary,
      secondary: branding?.secondary_colour || APP_CONFIG.defaults.branding.secondary,
      accent: branding?.accent_colour || APP_CONFIG.defaults.branding.accent,
    }
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

export async function retryFailedPlan(
  supabase: SupabaseClient,
  planId: string,
  userId: string
) {
  const plan = await getPlanWithClient(supabase, planId, userId)

  if (!plan) {
    throw new AppError('Plan not found', 'FORBIDDEN', 404)
  }

  if (plan.status !== 'failed') {
    throw new AppError('Can only retry failed plans', 'VALIDATION_ERROR', 400)
  }

  const DEV_MODE = process.env.DEV_MODE === 'true'

  // Fetch the client and trainer data
  const serviceDb = await createServiceClient()
  const client = await getClientById(serviceDb, plan.client_id)

  if (!client) {
    throw new AppError('Client data not found', 'VALIDATION_ERROR', 400)
  }

  let businessName: string | undefined

  if (DEV_MODE) {
    // Use mock trainer data in DEV_MODE
    businessName = DEV_TRAINER.business_name
  } else {
    const trainer = await getTrainerById(serviceDb, plan.trainer_id)

    if (!trainer) {
      throw new AppError('Trainer not found', 'VALIDATION_ERROR', 400)
    }

    businessName = trainer.business_name || undefined
  }

  // Reset plan status to pending
  await updatePlanStatus(serviceDb, planId, {
    status: 'pending',
    error_message: null,
  })

  // Re-send Inngest event with original data
  await inngest.send({
    name: 'plan/generate.requested',
    data: {
      planId: plan.id,
      clientId: client.id,
      trainerId: plan.trainer_id,
      formData: client.form_data as unknown as Record<string, unknown>,
      businessName,
    },
  })

  writeAuditLog({
    userId,
    action: 'plan.retry_requested',
    resourceType: 'plan',
    resourceId: planId,
    metadata: { clientId: client.id },
  })

  return { plan_id: planId }
}
