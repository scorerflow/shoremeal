import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { handleRouteError } from '@/lib/errors'
import { sendPlanToClient } from '@/lib/services/email'

export const POST = withAuth(async (request, { user, supabase, ip }, params) => {
  try {
    const planId = params?.id
    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      )
    }

    // Rate limit: 10 emails per minute per user
    const rateLimitResponse = await checkRateLimit('billing', `email:${user.id}`)
    if (rateLimitResponse) return rateLimitResponse

    const result = await sendPlanToClient(supabase, planId, user.id, ip)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return handleRouteError(error, 'send-plan-email')
  }
})
