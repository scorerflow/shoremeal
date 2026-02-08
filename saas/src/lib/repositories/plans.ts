import type { SupabaseClient } from '@supabase/supabase-js'
import type { Plan, PlanStatus } from '@/types'

export interface PlanWithClient {
  id: string
  status: PlanStatus
  plan_text: string | null
  trainer_id: string
  created_at: string
  updated_at: string
  clients: { name: string } | null
}

export interface PlanListRow {
  id: string
  status: PlanStatus
  generation_cost: number
  tokens_used: number
  created_at: string
  updated_at: string
  clients: { name: string } | null
}

export async function createPlan(
  db: SupabaseClient,
  data: {
    client_id: string
    trainer_id: string
    status: PlanStatus
  }
): Promise<Plan> {
  const { data: plan, error } = await db
    .from('plans')
    .insert({
      client_id: data.client_id,
      trainer_id: data.trainer_id,
      pdf_url: null,
      plan_text: null,
      generation_cost: 0,
      tokens_used: 0,
      status: data.status,
    })
    .select()
    .single()

  if (error || !plan) {
    throw new Error(`Failed to create plan: ${error?.message || 'Unknown error'}`)
  }

  return plan as Plan
}

export async function getPlanWithClient(
  db: SupabaseClient,
  planId: string,
  trainerId?: string
): Promise<PlanWithClient | null> {
  let query = db
    .from('plans')
    .select('id, status, plan_text, trainer_id, created_at, updated_at, clients(name)')
    .eq('id', planId)

  if (trainerId) {
    query = query.eq('trainer_id', trainerId)
  }

  const { data, error } = await query.single()

  if (error || !data) return null
  return data as unknown as PlanWithClient
}

export async function getPlanStatus(
  db: SupabaseClient,
  planId: string,
  trainerId?: string
): Promise<PlanWithClient | null> {
  return getPlanWithClient(db, planId, trainerId)
}

export async function updatePlanStatus(
  db: SupabaseClient,
  planId: string,
  updates: Partial<Pick<Plan, 'status' | 'plan_text' | 'generation_cost' | 'tokens_used' | 'error_message'>>
): Promise<void> {
  const { error } = await db
    .from('plans')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', planId)

  if (error) throw new Error(`Failed to update plan: ${error.message}`)
}

export async function getPlansByTrainer(
  db: SupabaseClient,
  trainerId: string
): Promise<PlanListRow[]> {
  const { data, error } = await db
    .from('plans')
    .select('id, status, generation_cost, tokens_used, created_at, updated_at, clients(name)')
    .eq('trainer_id', trainerId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch plans: ${error.message}`)
  return (data as unknown as PlanListRow[]) || []
}

export async function getPlanCount(
  db: SupabaseClient,
  trainerId: string
): Promise<number> {
  const { count, error } = await db
    .from('plans')
    .select('*', { count: 'exact', head: true })
    .eq('trainer_id', trainerId)

  if (error) throw new Error(`Failed to count plans: ${error.message}`)
  return count || 0
}
