import type { SupabaseClient } from '@supabase/supabase-js'
import { updateBranding as updateBrandingRepo } from '@/lib/repositories/branding'

export async function updateTrainerBranding(
  supabase: SupabaseClient,
  userId: string,
  data: {
    logo_url?: string | null
    primary_colour: string
    secondary_colour: string
    accent_colour: string
  }
) {
  await updateBrandingRepo(supabase, userId, data)
  return { success: true }
}
