import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { validationError, handleRouteError } from '@/lib/errors'
import { stripe } from '@/lib/stripe'
import { syncCheckoutToDatabase } from '@/lib/services/billing'
import { checkoutVerifySchema } from '@/lib/validation'

export const POST = withAuth(async (request: NextRequest, { user, supabase, ip }) => {
  try {
    const rateLimitResponse = await checkRateLimit('billing', ip)
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const parsed = checkoutVerifySchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const session = await stripe.checkout.sessions.retrieve(parsed.data.sessionId)

    // Verify session belongs to this user via subscription metadata
    if (!session.subscription) {
      return NextResponse.json({ verified: false, reason: 'no_subscription' })
    }

    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    )

    if (subscription.metadata.trainer_id !== user.id) {
      return NextResponse.json({ verified: false, reason: 'session_mismatch' }, { status: 403 })
    }

    // Sync to database (idempotent — safe if webhook already ran)
    const { tier, status } = await syncCheckoutToDatabase(supabase, session)

    return NextResponse.json({ verified: true, tier, status })
  } catch (error) {
    return handleRouteError(error, 'checkout-verify')
  }
})
