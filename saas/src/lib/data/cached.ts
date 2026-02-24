/**
 * Request-scoped cached data functions
 *
 * Uses React.cache() to deduplicate identical async calls within a single
 * server render pass. Layout + child page share the same render, so wrapping
 * trainer/branding fetches here eliminates redundant DB hits.
 *
 * Only used by server components — API routes are separate HTTP requests
 * where React.cache() doesn't apply.
 */

import { cache } from 'react'
import type { Trainer, Branding } from '@/types'

async function getSupabaseClient() {
  const DEV_MODE = process.env.DEV_MODE === 'true'
  if (DEV_MODE) {
    const { createServiceClient } = await import('@/lib/supabase/server')
    return createServiceClient()
  }
  const { createClient } = await import('@/lib/supabase/server')
  return createClient()
}

export const getCachedTrainer = cache(async (trainerId: string): Promise<Trainer | null> => {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('trainers')
    .select('*')
    .eq('id', trainerId)
    .single()

  if (error || !data) return null
  return data as Trainer
})

export const getCachedBranding = cache(async (trainerId: string): Promise<Branding | null> => {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('branding')
    .select('*')
    .eq('trainer_id', trainerId)
    .single()

  if (error || !data) return null
  return data as Branding
})
