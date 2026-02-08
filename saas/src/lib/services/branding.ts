import type { SupabaseClient } from '@supabase/supabase-js'
import { updateBranding as updateBrandingRepo } from '@/lib/repositories/branding'

export async function updateTrainerBranding(
  supabase: SupabaseClient,
  userId: string,
  colours: {
    primary_colour: string
    secondary_colour: string
    accent_colour: string
  }
) {
  await updateBrandingRepo(supabase, userId, colours)
  return { success: true }
}
