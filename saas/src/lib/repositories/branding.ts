import type { SupabaseClient } from '@supabase/supabase-js'
import type { Branding } from '@/types'

export async function getBrandingByTrainer(
  db: SupabaseClient,
  trainerId: string
): Promise<Branding | null> {
  const { data, error } = await db
    .from('branding')
    .select('*')
    .eq('trainer_id', trainerId)
    .single()

  if (error || !data) return null
  return data as Branding
}

export async function getBrandingColours(
  db: SupabaseClient,
  trainerId: string
): Promise<{ primary_colour: string; secondary_colour: string; accent_colour: string } | null> {
  const { data, error } = await db
    .from('branding')
    .select('primary_colour, secondary_colour, accent_colour')
    .eq('trainer_id', trainerId)
    .single()

  if (error || !data) return null
  return data as { primary_colour: string; secondary_colour: string; accent_colour: string }
}

export async function updateBranding(
  db: SupabaseClient,
  trainerId: string,
  colours: {
    primary_colour: string
    secondary_colour: string
    accent_colour: string
  }
): Promise<void> {
  const { error } = await db
    .from('branding')
    .update({
      ...colours,
      updated_at: new Date().toISOString(),
    })
    .eq('trainer_id', trainerId)

  if (error) throw new Error(`Failed to update branding: ${error.message}`)
}
