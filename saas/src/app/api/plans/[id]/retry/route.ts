import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { handleRouteError } from '@/lib/errors'
import { retryFailedPlan } from '@/lib/services/plans'

export const POST = withAuth(async (request, { user, supabase }, params) => {
  try {
    const planId = params?.id
    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      )
    }

    const result = await retryFailedPlan(supabase, planId, user.id)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return handleRouteError(error, 'retry-plan')
  }
})
