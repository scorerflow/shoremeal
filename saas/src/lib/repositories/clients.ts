import type { SupabaseClient } from '@supabase/supabase-js'
import type { Client, PlanStatus } from '@/types'

export interface ClientWithPlans {
  id: string
  name: string
  email: string | null
  created_at: string
  plans: { id: string; status: PlanStatus; created_at: string }[]
}

export async function createClient(
  db: SupabaseClient,
  data: {
    trainer_id: string
    name: string
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

export async function getClientsByTrainer(
  db: SupabaseClient,
  trainerId: string
): Promise<ClientWithPlans[]> {
  const { data, error } = await db
    .from('clients')
    .select('id, name, email, created_at, plans(id, status, created_at)')
    .eq('trainer_id', trainerId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch clients: ${error.message}`)
  return (data as unknown as ClientWithPlans[]) || []
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
