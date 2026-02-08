/**
 * Plans list data layer
 * Fetches plans list with client names
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { PlanStatus } from '@/types'
import { getPlansByTrainer } from '@/lib/repositories/plans'
import { DEV_PLANS } from '@/lib/dev-fixtures'

const DEV_MODE = process.env.DEV_MODE === 'true'

export interface PlanRow {
  id: string
  status: PlanStatus
  generation_cost: number
  tokens_used: number
  created_at: string
  updated_at: string
  clients: { name: string } | null
}

export async function getPlansList(
  supabase: SupabaseClient,
  userId: string
): Promise<PlanRow[]> {
  if (DEV_MODE) {
    return DEV_PLANS
  }

  return getPlansByTrainer(supabase, userId)
}
