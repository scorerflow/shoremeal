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
  phone: string | null
  last_plan_date: string | null
  created_at: string
  updated_at: string
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
    phone: result.phone,
    last_plan_date: result.last_plan_date,
    created_at: result.created_at,
    updated_at: result.updated_at,
    form_data: result.form_data as unknown as ClientFormData,
    plans: result.plans,
  }
}
