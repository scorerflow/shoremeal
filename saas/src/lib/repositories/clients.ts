import type { SupabaseClient } from '@supabase/supabase-js'
import type { Client, PlanStatus } from '@/types'

export interface ClientWithPlans {
  id: string
  name: string
  email: string | null
  phone: string | null
  last_plan_date: string | null
  created_at: string
  plans: { id: string; status: PlanStatus; created_at: string }[]
}

export async function createClient(
  db: SupabaseClient,
  data: {
    trainer_id: string
    name: string
    email?: string | null
    phone?: string | null
    form_data: Record<string, unknown>
  }
): Promise<Client> {
  const { data: client, error } = await db
    .from('clients')
    .insert(data)
    .select()
    .single()

  if (error || !client) {
    throw new Error(`Failed to create client: ${error?.message || 'Unknown error'}`)
  }

  return client as Client
}

export async function getClientById(
  db: SupabaseClient,
  clientId: string
): Promise<Client | null> {
  const { data, error } = await db
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()

  if (error || !data) return null
  return data as Client
}

export interface ClientsByTrainerResult {
  clients: ClientWithPlans[]
  hasMore: boolean
}

export async function getClientsByTrainer(
  db: SupabaseClient,
  trainerId: string,
  options?: {
    sortBy?: 'name' | 'last_plan_date' | 'created_at'
    sortOrder?: 'asc' | 'desc'
    limit?: number
  }
): Promise<ClientsByTrainerResult> {
  const sortBy = options?.sortBy || 'last_plan_date'
  const sortOrder = options?.sortOrder === 'asc'
  const limit = options?.limit ?? 100

  const { data, error } = await db
    .from('clients')
    .select('id, name, email, phone, last_plan_date, created_at, plans(id, status, created_at)')
    .eq('trainer_id', trainerId)
    .order(sortBy, { ascending: sortOrder, nullsFirst: false })
    .range(0, limit)

  if (error) throw new Error(`Failed to fetch clients: ${error.message}`)

  const allClients = (data as unknown as ClientWithPlans[]) || []
  const hasMore = allClients.length > limit
  const clients = hasMore ? allClients.slice(0, limit) : allClients

  return { clients, hasMore }
}

export async function getClientCount(
  db: SupabaseClient,
  trainerId: string
): Promise<number> {
  const { count, error } = await db
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('trainer_id', trainerId)

  if (error) throw new Error(`Failed to count clients: ${error.message}`)
  return count || 0
}

export interface ClientWithAllPlans {
  id: string
  trainer_id: string
  name: string
  email: string | null
  phone: string | null
  form_data: Record<string, unknown>
  last_plan_date: string | null
  created_at: string
  updated_at: string
  plans: { id: string; status: PlanStatus; created_at: string; updated_at: string }[]
}

export async function getClientWithPlans(
  db: SupabaseClient,
  clientId: string,
  trainerId: string
): Promise<ClientWithAllPlans | null> {
  const { data, error } = await db
    .from('clients')
    .select('id, trainer_id, name, email, phone, form_data, last_plan_date, created_at, updated_at, plans(id, status, created_at, updated_at)')
    .eq('id', clientId)
    .eq('trainer_id', trainerId)
    .order('created_at', { ascending: false, referencedTable: 'plans' })
    .single()

  if (error || !data) return null
  return data as unknown as ClientWithAllPlans
}

export async function updateClient(
  db: SupabaseClient,
  clientId: string,
  trainerId: string,
  data: {
    name?: string
    email?: string | null
    phone?: string | null
    form_data?: Record<string, unknown>
  }
): Promise<Client> {
  const { data: client, error } = await db
    .from('clients')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', clientId)
    .eq('trainer_id', trainerId)
    .select()
    .single()

  if (error || !client) {
    throw new Error(`Failed to update client: ${error?.message || 'Unknown error'}`)
  }

  return client as Client
}

export async function getClientPlans(
  db: SupabaseClient,
  clientId: string,
  trainerId: string,
  options?: { limit?: number }
): Promise<{ id: string; status: PlanStatus; created_at: string; updated_at: string }[]> {
  let query = db
    .from('plans')
    .select('id, status, created_at, updated_at')
    .eq('client_id', clientId)
    .eq('trainer_id', trainerId)
    .order('created_at', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) throw new Error(`Failed to fetch client plans: ${error.message}`)
  return data || []
}

export async function updateClientLastPlanDate(
  db: SupabaseClient,
  clientId: string
): Promise<void> {
  const { error } = await db
    .from('clients')
    .update({
      last_plan_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', clientId)

  if (error) {
    console.error('Failed to update client last_plan_date:', error)
    // Don't throw - this is a denormalized field update, not critical
  }
}
