/**
 * Plans list data layer
 * Fetches plans list with client names
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { PlanStatus } from '@/types'
import { getPlansByTrainer } from '@/lib/repositories/plans'

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
  return getPlansByTrainer(supabase, userId)
}
