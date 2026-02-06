import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCustomerPortalSession } from '@/lib/stripe'
import { checkRateLimit } from '@/lib/rate-limit'
import { apiError, handleRouteError } from '@/lib/errors'
import { writeAuditLog } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResponse = await checkRateLimit('billing', ip)
    if (rateLimitResponse) return rateLimitResponse

    // Auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401)
    }

    // Get trainer's Stripe customer ID
    const { data: trainer } = await supabase
      .from('trainers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!trainer?.stripe_customer_id) {
      return apiError('No active subscription', 'SUBSCRIPTION_REQUIRED', 400)
    }

    // Create portal session
    const session = await createCustomerPortalSession(
      trainer.stripe_customer_id,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    )

    // Fire-and-forget audit log
    writeAuditLog({
      userId: user.id,
      action: 'billing.portal_accessed',
      resourceType: 'billing',
      ipAddress: ip,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    return handleRouteError(error, 'billing')
  }
}
