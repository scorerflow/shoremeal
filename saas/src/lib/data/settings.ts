/**
 * Settings data layer
 * Fetches trainer profile and branding settings
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Trainer, Branding } from '@/types'
import { getTrainerById } from '@/lib/repositories/trainers'
import { getBrandingByTrainer } from '@/lib/repositories/branding'
import { DEV_TRAINER, DEV_BRANDING } from '@/lib/dev-fixtures'

const DEV_MODE = process.env.DEV_MODE === 'true'

export interface SettingsData {
  trainer: Trainer | null
  branding: Branding | null
}

export async function getSettingsData(
  supabase: SupabaseClient,
  userId: string
): Promise<SettingsData> {
  if (DEV_MODE) {
    return {
      trainer: DEV_TRAINER as Trainer,
      branding: DEV_BRANDING as Branding,
    }
  }

  const trainer = await getTrainerById(supabase, userId)
  const branding = await getBrandingByTrainer(supabase, userId)

  return {
    trainer,
    branding,
  }
}
