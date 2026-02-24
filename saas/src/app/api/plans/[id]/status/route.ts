import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { handleRouteError } from '@/lib/errors'

/**
 * GET /api/plans/[id]/status
 *
 * Returns real-time plan status with queue position and time estimates
 *
 * Security:
 * - Requires authentication (via withAuth)
 * - RLS enforces user can only see their own plans
 * - Returns 403 if attempting to access another user's plan
 *
 * Response:
 * {
 *   id: string
 *   status: 'pending' | 'generating' | 'completed' | 'failed'
 *   queuePosition: number (0 if completed/failed)
 *   totalInQueue: number
 *   estimatedMinutes: number
 *   elapsedSeconds: number
 *   errorMessage?: string
 *   attempts: number
 * }
 */
export const GET = withAuth(async (request: NextRequest, { user, supabase }, params) => {
  try {
    const planId = params?.id as string

    // Fetch plan with RLS applied (automatically filters by trainer_id)
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, status, created_at, updated_at, trainer_id, error_message, attempts, plan_text, client_id, clients(name)')
      .eq('id', planId)
      .single()

    // Plan not found (either doesn't exist or user doesn't have access)
    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    // Paranoid security check: Verify ownership
    // (RLS already handles this, but belt + suspenders for critical data)
    if (plan.trainer_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Calculate queue metrics (only for pending/generating plans)
    let queuePosition = 0
    let totalInQueue = 0
    let estimatedMinutes = 0

    if (plan.status === 'pending' || plan.status === 'generating') {
      // Single query: fetch created_at of all queued plans, count in JS
      // Queue is inherently small (plans process quickly), so fetching timestamps is negligible
      const { data: queuedPlans } = await supabase
        .from('plans')
        .select('created_at')
        .in('status', ['pending', 'generating'])

      const plansAhead = queuedPlans?.filter(p => p.created_at < plan.created_at).length || 0
      totalInQueue = queuedPlans?.length || 1
      queuePosition = plansAhead + 1

      // Time estimation algorithm:
      // - Average plan takes ~30 seconds (Claude API + PDF generation)
      // - Claude API Tier 1: max 5 concurrent requests
      // - So effective throughput: 5 plans per 30 seconds = 1 plan per 6 seconds
      // - Formula: position * 6 seconds / 60 = minutes
      const avgSecondsPerPlan = 30
      const concurrentCapacity = 5
      const effectiveSecondsPerPlan = avgSecondsPerPlan / concurrentCapacity
      const estimatedSeconds = queuePosition * effectiveSecondsPerPlan

      // Round up to nearest minute (conservative estimate)
      estimatedMinutes = Math.ceil(estimatedSeconds / 60)

      // Cap at 10 minutes (sanity check - if it's longer, something's wrong)
      estimatedMinutes = Math.min(estimatedMinutes, 10)
    }

    // Calculate elapsed time since creation
    const createdAt = new Date(plan.created_at)
    const now = new Date()
    const elapsedSeconds = Math.floor((now.getTime() - createdAt.getTime()) / 1000)

    // Return status with queue metrics and plan data
    return NextResponse.json({
      id: plan.id,
      status: plan.status,
      queuePosition,
      totalInQueue,
      estimatedMinutes,
      elapsedSeconds,
      errorMessage: plan.error_message || null,
      attempts: plan.attempts || 0,
      plan_text: plan.plan_text || null,
      client_id: plan.client_id || null,
      client_name: plan.clients?.[0]?.name || null,
      created_at: plan.created_at,
      updated_at: plan.updated_at,
    })

  } catch (error) {
    return handleRouteError(error, 'queue-status')
  }
})
