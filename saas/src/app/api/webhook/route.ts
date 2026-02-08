import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { getWebhookEvent, upsertWebhookEvent, updateWebhookEventStatus } from '@/lib/repositories/webhook-events'
import { WEBHOOK_HANDLERS } from '@/lib/services/webhooks'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Idempotency check
  const existing = await getWebhookEvent(supabase, event.id)
  if (existing?.status === 'processed') {
    return NextResponse.json({ received: true, skipped: true })
  }

  await upsertWebhookEvent(supabase, event.id, event.type, event.data.object as Record<string, unknown>, 'processing')

  try {
    const handler = WEBHOOK_HANDLERS[event.type]
    if (handler) {
      await handler(supabase, event.data.object)
    }

    await updateWebhookEventStatus(supabase, event.id, 'processed')
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    await updateWebhookEventStatus(supabase, event.id, 'failed', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
