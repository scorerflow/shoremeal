import type { SupabaseClient } from '@supabase/supabase-js'
import { getPlanWithClient } from '@/lib/repositories/plans'
import { getClientById } from '@/lib/repositories/clients'
import { getTrainerById } from '@/lib/repositories/trainers'
import { getBrandingColours } from '@/lib/repositories/branding'
import { generatePlanPdf } from '@/lib/pdf/generate'
import { sendPlanEmail } from '@/lib/email'
import { writeAuditLog } from '@/lib/audit'
import { AppError } from '@/lib/errors'
import { APP_CONFIG } from '@/lib/config'

export async function sendPlanToClient(
  supabase: SupabaseClient,
  planId: string,
  userId: string,
  ip: string
): Promise<{ emailId: string; sentTo: string }> {
  // 1. Fetch plan — validates exists, completed, has text
  const plan = await getPlanWithClient(supabase, planId, userId)

  if (!plan) {
    throw new AppError('Plan not found', 'FORBIDDEN', 404)
  }

  if (plan.status !== 'completed' || !plan.plan_text) {
    throw new AppError('Plan is not ready to send', 'VALIDATION_ERROR', 400)
  }

  // 2. Fetch client — validates has email
  const client = await getClientById(supabase, plan.client_id)

  if (!client) {
    throw new AppError('Client not found', 'FORBIDDEN', 404)
  }

  if (!client.email) {
    throw new AppError('Client does not have an email address', 'VALIDATION_ERROR', 400)
  }

  // Basic email format check (defense in depth — Zod validates on creation)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(client.email)) {
    throw new AppError('Client email address is invalid', 'VALIDATION_ERROR', 400)
  }

  // 3. Fetch trainer + branding in parallel
  const [trainer, branding] = await Promise.all([
    getTrainerById(supabase, userId),
    getBrandingColours(supabase, userId),
  ])

  const trainerName = trainer?.full_name || trainer?.business_name || 'Your Trainer'
  const businessName = trainer?.business_name || trainerName
  const trainerEmail = trainer?.email || ''
  const clientName = plan.clients?.name || client.name

  const colours = {
    primary: branding?.primary_colour || APP_CONFIG.defaults.branding.primary,
    secondary: branding?.secondary_colour || APP_CONFIG.defaults.branding.secondary,
    accent: branding?.accent_colour || APP_CONFIG.defaults.branding.accent,
  }

  // 4. Generate PDF
  const pdfBuffer = await generatePlanPdf({
    planText: plan.plan_text,
    clientName,
    trainerName,
    businessName,
    colours,
    createdAt: plan.created_at,
  })

  // 5. Send email
  const pdfFilename = `${clientName.replace(/[^a-zA-Z0-9]/g, '_')}_Nutrition_Plan.pdf`

  const emailId = await sendPlanEmail({
    to: client.email,
    clientName,
    trainerName,
    businessName,
    trainerEmail,
    primaryColour: colours.primary,
    pdfBuffer,
    pdfFilename,
  })

  // 6. Audit log (fire-and-forget)
  writeAuditLog({
    userId,
    action: 'plan.email_sent',
    resourceType: 'plan',
    resourceId: planId,
    metadata: {
      clientId: client.id,
      clientEmail: client.email,
      emailId,
    },
    ipAddress: ip,
  })

  return { emailId, sentTo: client.email }
}
