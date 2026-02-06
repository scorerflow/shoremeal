import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PRICE_IDS, createCustomer } from '@/lib/stripe'
import type { PriceTier } from '@/lib/stripe'
import { checkoutSchema } from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'
import { validationError, apiError, handleRouteError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResponse = await checkRateLimit('billing', ip)
    if (rateLimitResponse) return rateLimitResponse

    // Validate input
    const rawBody = await request.json()
    const parsed = checkoutSchema.safeParse(rawBody)

    if (!parsed.success) {
      return validationError(parsed.error)
    }

    const { tier } = parsed.data

    // Auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401)
    }

    if (!PRICE_IDS[tier as PriceTier]) {
      return apiError('Invalid tier', 'VALIDATION_ERROR', 400)
    }

    // Get or create Stripe customer
    const { data: trainer } = await supabase
      .from('trainers')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single()

    let customerId = trainer?.stripe_customer_id

    if (!customerId) {
      const customer = await createCustomer(
        trainer?.email || user.email!,
        trainer?.full_name || undefined
      )
      customerId = customer.id

      await supabase
        .from('trainers')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_IDS[tier as PriceTier],
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          trainer_id: user.id,
          tier: tier,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    return handleRouteError(error, 'checkout')
  }
}
