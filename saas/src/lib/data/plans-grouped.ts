/**
 * Plans grouped by client data layer
 * Returns plans organized by client for better UX
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { PlanStatus } from '@/types'

export interface GroupedPlan {
  id: string
  status: PlanStatus
  created_at: string
  updated_at: string
  tokens_used: number
  generation_cost: number
}

export interface ClientWithPlans {
  client_id: string
  client_name: string
  plan_count: number
  last_plan_date: string
  plans: GroupedPlan[]
  stats: {
    completed: number
    pending: number
    generating: number
    failed: number
  }
}

export interface PlansGroupedResult {
  groups: ClientWithPlans[]
  hasMore: boolean
}

export async function getPlansGroupedByClient(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 200
): Promise<PlansGroupedResult> {
  // Fetch limit+1 to detect if there are more plans beyond the limit
  const { data: plans, error } = await supabase
    .from('plans')
    .select('id, status, created_at, updated_at, tokens_used, generation_cost, client_id, clients!inner(id, name)')
    .eq('trainer_id', userId)
    .order('created_at', { ascending: false })
    .range(0, limit)

  if (error) {
    throw new Error(`Failed to fetch plans: ${error.message}`)
  }

  // Detect hasMore and trim to limit
  const allPlans = plans || []
  const hasMore = allPlans.length > limit
  const trimmedPlans = hasMore ? allPlans.slice(0, limit) : allPlans

  // Group plans by client
  const clientMap = new Map<string, ClientWithPlans>()

  for (const plan of trimmedPlans) {
    const clientId = plan.client_id
    const clientName = (plan.clients as unknown as { name: string })?.name || 'Unknown Client'

    if (!clientMap.has(clientId)) {
      clientMap.set(clientId, {
        client_id: clientId,
        client_name: clientName,
        plan_count: 0,
        last_plan_date: plan.created_at,
        plans: [],
        stats: {
          completed: 0,
          pending: 0,
          generating: 0,
          failed: 0,
        },
      })
    }

    const clientData = clientMap.get(clientId)!

    // Add plan to client
    clientData.plans.push({
      id: plan.id,
      status: plan.status as PlanStatus,
      created_at: plan.created_at,
      updated_at: plan.updated_at,
      tokens_used: plan.tokens_used || 0,
      generation_cost: plan.generation_cost || 0,
    })

    // Update stats
    clientData.plan_count++
    clientData.stats[plan.status as PlanStatus]++

    // Update last_plan_date if this plan is newer
    if (new Date(plan.created_at) > new Date(clientData.last_plan_date)) {
      clientData.last_plan_date = plan.created_at
    }
  }

  // Convert map to array and sort by last_plan_date (most recent first)
  const groups = Array.from(clientMap.values()).sort(
    (a, b) => new Date(b.last_plan_date).getTime() - new Date(a.last_plan_date).getTime()
  )

  return { groups, hasMore }
}
