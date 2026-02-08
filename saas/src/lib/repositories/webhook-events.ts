import type { SupabaseClient } from '@supabase/supabase-js'

export interface WebhookEventRow {
  id: string
  status: 'processing' | 'processed' | 'failed'
}

export async function getWebhookEvent(
  db: SupabaseClient,
  eventId: string
): Promise<WebhookEventRow | null> {
  const { data, error } = await db
    .from('webhook_events')
    .select('id, status')
    .eq('id', eventId)
    .single()

  if (error || !data) return null
  return data as WebhookEventRow
}

export async function upsertWebhookEvent(
  db: SupabaseClient,
  eventId: string,
  eventType: string,
  payload: Record<string, unknown>,
  status: 'processing' | 'processed' | 'failed'
): Promise<void> {
  const { error } = await db
    .from('webhook_events')
    .upsert({
      id: eventId,
      event_type: eventType,
      payload,
      status,
    })

  if (error) throw new Error(`Failed to upsert webhook event: ${error.message}`)
}

export async function updateWebhookEventStatus(
  db: SupabaseClient,
  eventId: string,
  status: 'processed' | 'failed',
  errorMessage?: string
): Promise<void> {
  const update: Record<string, unknown> = { status }
  if (errorMessage) update.error_message = errorMessage

  const { error } = await db
    .from('webhook_events')
    .update(update)
    .eq('id', eventId)

  if (error) throw new Error(`Failed to update webhook event: ${error.message}`)
}
