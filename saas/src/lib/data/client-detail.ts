/**
 * Client detail data layer
 * Fetches a single client with all their plans
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ClientFormData, PlanStatus } from '@/types'
import { getClientWithPlans, type ClientWithAllPlans } from '@/lib/repositories/clients'

export interface ClientDetailData {
  id: string
  name: string
  email: string | null
  created_at: string
  form_data: ClientFormData
  plans: { id: string; status: PlanStatus; created_at: string; updated_at: string }[]
}

export async function getClientDetail(
  supabase: SupabaseClient,
  clientId: string,
  userId: string
): Promise<ClientDetailData | null> {
  const result = await getClientWithPlans(supabase, clientId, userId)
  if (!result) return null

  return {
    id: result.id,
    name: result.name,
    email: result.email,
    created_at: result.created_at,
    form_data: result.form_data as unknown as ClientFormData,
    plans: result.plans,
  }
}
