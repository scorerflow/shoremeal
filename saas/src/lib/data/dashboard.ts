/**
 * Dashboard data layer
 * Fetches dashboard overview stats (trainer profile, client count, plan count)
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Trainer } from '@/types'
import { getTrainerById } from '@/lib/repositories/trainers'
import { getClientCount } from '@/lib/repositories/clients'
import { getPlanCount } from '@/lib/repositories/plans'
import { DEV_TRAINER, DEV_CLIENT_COUNT, DEV_PLAN_COUNT } from '@/lib/dev-fixtures'

const DEV_MODE = process.env.DEV_MODE === 'true'

export interface DashboardData {
  trainer: Trainer | null
  clientCount: number
  planCount: number
}

export async function getDashboardData(
  supabase: SupabaseClient,
  userId: string
): Promise<DashboardData> {
  if (DEV_MODE) {
    return {
      trainer: DEV_TRAINER as Trainer,
      clientCount: DEV_CLIENT_COUNT,
      planCount: DEV_PLAN_COUNT,
    }
  }

  const trainer = await getTrainerById(supabase, userId)
  const clientCount = await getClientCount(supabase, userId)
  const planCount = await getPlanCount(supabase, userId)

  return {
    trainer,
    clientCount,
    planCount,
  }
}
