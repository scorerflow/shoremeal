import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { handleRouteError, apiError } from '@/lib/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planId = params.id

    const DEV_MODE = process.env.DEV_MODE === 'true'
    let userId: string | null = null

    if (!DEV_MODE) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return apiError('Unauthorized', 'UNAUTHORIZED', 401)
      }
      userId = user.id
    }

    // Use service client to bypass RLS (we check ownership manually)
    const supabase = await createServiceClient()

    let query = supabase
      .from('plans')
      .select('id, status, plan_text, created_at, updated_at, clients(name)')
      .eq('id', planId)

    if (userId) {
      query = query.eq('trainer_id', userId)
    }

    const { data: plan, error } = await query.single()

    if (error || !plan) {
      return apiError('Plan not found', 'FORBIDDEN', 404)
    }

    const clientData = plan.clients as unknown as { name: string } | null

    const response: Record<string, unknown> = {
      id: plan.id,
      status: plan.status,
      created_at: plan.created_at,
      updated_at: plan.updated_at,
      client_name: clientData?.name || null,
    }

    // Only include plan_text when completed (avoid sending large text on every poll)
    if (plan.status === 'completed' && plan.plan_text) {
      response.plan_text = plan.plan_text
    }

    return NextResponse.json(response)
  } catch (error) {
    return handleRouteError(error, 'plans/status')
  }
}
