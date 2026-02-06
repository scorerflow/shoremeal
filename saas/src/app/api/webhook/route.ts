import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Idempotency check: skip if we've already processed this event
  const { data: existingEvent } = await supabase
    .from('webhook_events')
    .select('id, status')
    .eq('id', event.id)
    .single()

  if (existingEvent?.status === 'processed') {
    return NextResponse.json({ received: true, skipped: true })
  }

  // Record the event as processing
  await supabase
    .from('webhook_events')
    .upsert({
      id: event.id,
      event_type: event.type,
      payload: event.data.object as Record<string, unknown>,
      status: 'processing',
    })

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )
        const tier = subscription.metadata.tier || 'starter'
        const trainerId = subscription.metadata.trainer_id

        await supabase
          .from('trainers')
          .update({
            stripe_customer_id: session.customer as string,
            subscription_tier: tier,
            subscription_status: 'active',
            billing_cycle_start: new Date().toISOString(),
            plans_used_this_month: 0,
          })
          .eq('id', trainerId)

        await writeAuditLog({
          userId: trainerId,
          action: 'subscription.created',
          resourceType: 'subscription',
          resourceId: session.subscription as string,
          metadata: { tier, customerId: session.customer },
        })

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const trainerId = subscription.metadata.trainer_id

        if (trainerId) {
          const tier = subscription.metadata.tier || 'starter'
          const status = subscription.status === 'active' ? 'active' :
                        subscription.status === 'past_due' ? 'past_due' :
                        subscription.status === 'canceled' ? 'cancelled' : 'active'

          await supabase
            .from('trainers')
            .update({
              subscription_tier: tier,
              subscription_status: status,
            })
            .eq('id', trainerId)

          await writeAuditLog({
            userId: trainerId,
            action: 'subscription.updated',
            resourceType: 'subscription',
            resourceId: subscription.id,
            metadata: { tier, status },
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const trainerId = subscription.metadata.trainer_id

        if (trainerId) {
          await supabase
            .from('trainers')
            .update({
              subscription_tier: null,
              subscription_status: 'cancelled',
            })
            .eq('id', trainerId)

          await writeAuditLog({
            userId: trainerId,
            action: 'subscription.cancelled',
            resourceType: 'subscription',
            resourceId: subscription.id,
          })
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.billing_reason === 'subscription_cycle') {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          )
          const trainerId = subscription.metadata.trainer_id

          if (trainerId) {
            await supabase
              .from('trainers')
              .update({
                plans_used_this_month: 0,
                billing_cycle_start: new Date().toISOString(),
              })
              .eq('id', trainerId)

            await writeAuditLog({
              userId: trainerId,
              action: 'subscription.payment_succeeded',
              resourceType: 'invoice',
              resourceId: invoice.id,
            })
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        )
        const trainerId = subscription.metadata.trainer_id

        if (trainerId) {
          await supabase
            .from('trainers')
            .update({ subscription_status: 'past_due' })
            .eq('id', trainerId)

          await writeAuditLog({
            userId: trainerId,
            action: 'subscription.payment_failed',
            resourceType: 'invoice',
            resourceId: invoice.id,
          })
        }
        break
      }
    }

    // Mark event as processed
    await supabase
      .from('webhook_events')
      .update({ status: 'processed' })
      .eq('id', event.id)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)

    // Mark event as failed
    await supabase
      .from('webhook_events')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', event.id)

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
