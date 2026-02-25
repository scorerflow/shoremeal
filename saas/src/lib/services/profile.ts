import type { SupabaseClient } from '@supabase/supabase-js'
import { updateTrainerProfile as updateProfileRepo } from '@/lib/repositories/trainers'

export async function updateTrainerProfile(
  supabase: SupabaseClient,
  userId: string,
  data: { full_name: string; business_name?: string | null }
) {
  await updateProfileRepo(supabase, userId, data)
  return { success: true }
}
