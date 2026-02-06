import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { TIERS, SubscriptionTier } from '@/types'
import { generatePlanSchema } from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'
import { validationError, apiError, handleRouteError } from '@/lib/errors'
import { writeAuditLog } from '@/lib/audit'
import { inngest } from '@/lib/inngest/client'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResponse = await checkRateLimit('generate', ip)
    if (rateLimitResponse) return rateLimitResponse

    // Validate input
    const rawBody = await request.json()
    const parsed = generatePlanSchema.safeParse(rawBody)

    if (!parsed.success) {
      return validationError(parsed.error)
    }

    const formData = parsed.data

    // Auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401)
    }

    // Check subscription
    const { data: trainer } = await supabase
      .from('trainers')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!trainer?.subscription_tier || trainer.subscription_status !== 'active') {
      return apiError('Active subscription required', 'SUBSCRIPTION_REQUIRED', 403)
    }

    const tier = trainer.subscription_tier as SubscriptionTier
    const limit = TIERS[tier].plansPerMonth

    if (trainer.plans_used_this_month >= limit) {
      return apiError(
        `Monthly plan limit reached (${limit} plans)`,
        'PLAN_LIMIT_REACHED',
        403
      )
    }

    // Create client record
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        trainer_id: user.id,
        name: formData.name,
        form_data: formData,
      })
      .select()
      .single()

    if (clientError) {
      console.error('Error creating client:', clientError)
      return apiError('Failed to create client record', 'INTERNAL_ERROR', 500)
    }

    // Create plan with pending status (using service role to bypass RLS for nullable pdf_url)
    const serviceSupabase = await createServiceClient()
    const { data: plan, error: planError } = await serviceSupabase
      .from('plans')
      .insert({
        client_id: client.id,
        trainer_id: user.id,
        pdf_url: null,
        plan_text: null,
        generation_cost: 0,
        tokens_used: 0,
        status: 'pending',
      })
      .select()
      .single()

    if (planError) {
      console.error('Error creating plan:', planError)
      return apiError('Failed to create plan record', 'INTERNAL_ERROR', 500)
    }

    // Send Inngest event for async generation
    await inngest.send({
      name: 'plan/generate.requested',
      data: {
        planId: plan.id,
        clientId: client.id,
        trainerId: user.id,
        formData: formData as unknown as Record<string, unknown>,
        businessName: trainer.business_name || undefined,
      },
    })

    // Fire-and-forget audit log
    writeAuditLog({
      userId: user.id,
      action: 'plan.generation_started',
      resourceType: 'plan',
      resourceId: plan.id,
      metadata: { clientId: client.id, tier },
      ipAddress: ip,
    })

    return NextResponse.json({
      success: true,
      plan_id: plan.id,
      client_id: client.id,
      status: 'pending',
    })
  } catch (error) {
    return handleRouteError(error, 'generate')
  }
}
