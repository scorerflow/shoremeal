import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { handleRouteError } from '@/lib/errors'
import { apiError } from '@/lib/errors'
import { deleteAccount } from '@/lib/services/account'

export const DELETE = withAuth(async (request, { user, supabase, ip }) => {
  try {
    const rateLimitResponse = await checkRateLimit('auth', ip)
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()

    if (body?.confirmation !== 'DELETE') {
      return apiError(
        'You must type DELETE to confirm account deletion',
        'VALIDATION_ERROR',
        400
      )
    }

    await deleteAccount(supabase, user.id, ip)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleRouteError(error, 'account-delete')
  }
})
