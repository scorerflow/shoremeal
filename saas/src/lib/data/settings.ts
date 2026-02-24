/**
 * Settings data layer
 * Fetches trainer profile and branding settings
 */

import type { Trainer, Branding } from '@/types'
import { getCachedTrainer, getCachedBranding } from '@/lib/data/cached'

export interface SettingsData {
  trainer: Trainer | null
  branding: Branding | null
}

export async function getSettingsData(
  userId: string
): Promise<SettingsData> {
  const trainer = await getCachedTrainer(userId)
  const branding = await getCachedBranding(userId)

  return {
    trainer,
    branding,
  }
}
