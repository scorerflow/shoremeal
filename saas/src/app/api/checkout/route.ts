import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { checkoutSchema } from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'
import { validationError, handleRouteError } from '@/lib/errors'
import { initiateCheckout } from '@/lib/services/billing'

export const POST = withAuth(async (request, { user, supabase, ip }) => {
  try {
    const rateLimitResponse = await checkRateLimit('billing', ip)
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const parsed = checkoutSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const result = await initiateCheckout(supabase, user.id, user.email!, parsed.data.tier)
    return NextResponse.json(result)
  } catch (error) {
    return handleRouteError(error, 'checkout')
  }
})
