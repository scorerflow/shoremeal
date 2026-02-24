/**
 * Dashboard data layer
 * Fetches dashboard overview stats (trainer profile, client count, plan count)
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Trainer } from '@/types'
import { getCachedTrainer } from '@/lib/data/cached'
import { getClientCount } from '@/lib/repositories/clients'
import { getPlanCount } from '@/lib/repositories/plans'

export interface DashboardData {
  trainer: Trainer | null
  clientCount: number
  planCount: number
}

export async function getDashboardData(
  supabase: SupabaseClient,
  userId: string
): Promise<DashboardData> {
  const trainer = await getCachedTrainer(userId)
  const clientCount = await getClientCount(supabase, userId)
  const planCount = await getPlanCount(supabase, userId)

  return {
    trainer,
    clientCount,
    planCount,
  }
}
