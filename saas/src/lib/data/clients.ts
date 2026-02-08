/**
 * Clients data layer
 * Fetches clients list with plan information
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { PlanStatus } from '@/types'
import { getClientsByTrainer, type ClientWithPlans } from '@/lib/repositories/clients'

export interface ClientRow {
  id: string
  name: string
  email: string | null
  created_at: string
  plans: { id: string; status: PlanStatus; created_at: string }[]
}

export async function getClientsList(
  supabase: SupabaseClient,
  userId: string
): Promise<ClientRow[]> {
  return getClientsByTrainer(supabase, userId)
}
