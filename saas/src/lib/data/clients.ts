/**
 * Clients data layer
 * Fetches clients list with plan information
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { PlanStatus } from '@/types'
import { getClientsByTrainer, type ClientWithPlans, type ClientsByTrainerResult } from '@/lib/repositories/clients'

export interface ClientRow {
  id: string
  name: string
  email: string | null
  phone: string | null
  last_plan_date: string | null
  created_at: string
  plans: { id: string; status: PlanStatus; created_at: string }[]
}

export interface ClientsListResult {
  clients: ClientRow[]
  hasMore: boolean
}

export async function getClientsList(
  supabase: SupabaseClient,
  userId: string,
  limit?: number
): Promise<ClientsListResult> {
  const result = await getClientsByTrainer(supabase, userId, limit ? { limit } : undefined)
  return { clients: result.clients, hasMore: result.hasMore }
}
