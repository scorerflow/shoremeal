import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { handleRouteError } from '@/lib/errors'
import { createBillingPortal } from '@/lib/services/billing'

export const POST = withAuth(async (request, { user, supabase, ip }) => {
  try {
    const rateLimitResponse = await checkRateLimit('billing', ip)
    if (rateLimitResponse) return rateLimitResponse

    const result = await createBillingPortal(supabase, user.id, ip)
    return NextResponse.json(result)
  } catch (error) {
    return handleRouteError(error, 'billing')
  }
})
