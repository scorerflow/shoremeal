// @vitest-environment node
/**
 * Unit tests for plans-grouped data layer
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createAuthenticatedUser, deleteUser } from '../../helpers/auth'
import { createServiceClient } from '../../helpers/db'
import { getPlansGroupedByClient } from '@/lib/data/plans-grouped'
import type { PlanStatus } from '@/types'

describe('Plans Grouped by Client', () => {
  let userId: string
  let otherUserId: string
  let supabase: ReturnType<typeof createServiceClient>
  let testClientIds: string[] = []
  let testPlanIds: string[] = []

  beforeAll(async () => {
    const user = await createAuthenticatedUser()
    const otherUser = await createAuthenticatedUser()
    userId = user.userId
    otherUserId = otherUser.userId
    supabase = createServiceClient()
  })

  afterAll(async () => {
    // Cleanup test data
    if (testPlanIds.length > 0) {
      await supabase.from('plans').delete().in('id', testPlanIds)
    }
    if (testClientIds.length > 0) {
      await supabase.from('clients').delete().in('id', testClientIds)
    }
    await deleteUser(userId)
    await deleteUser(otherUserId)
  })

  describe('getPlansGroupedByClient', () => {
    it('should return empty array when user has no plans', async () => {
      const result = await getPlansGroupedByClient(supabase, userId)

      expect(result).toEqual([])
      expect(Array.isArray(result)).toBe(true)
    })

    it('should return correct structure with single client and single plan', async () => {
      // Create test client
      const { data: client } = await supabase
        .from('clients')
        .insert({
          trainer_id: userId,
          name: 'Test Client Single',
          form_data: {
            age: 30,
            gender: 'M',
            height: 180,
            weight: 80,
            ideal_weight: 75,
            activity_level: 'moderately_active',
            goal: 'fat_loss',
            dietary_type: 'omnivore',
            budget: 70,
            cooking_skill: 'intermediate',
            prep_time: 30,
            meals_per_day: 3,
            plan_duration: 7,
            meal_prep_style: 'batch',
          },
        })
        .select()
        .single()

      testClientIds.push(client.id)

      // Create test plan
      const { data: plan } = await supabase
        .from('plans')
        .insert({
          trainer_id: userId,
          client_id: client.id,
          status: 'completed',
          tokens_used: 1000,
          generation_cost: 0.05,
        })
        .select()
        .single()

      testPlanIds.push(plan.id)

      // Test
      const result = await getPlansGroupedByClient(supabase, userId)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        client_id: client.id,
        client_name: 'Test Client Single',
        plan_count: 1,
        plans: expect.arrayContaining([
          expect.objectContaining({
            id: plan.id,
            status: 'completed',
            tokens_used: 1000,
            generation_cost: 0.05,
          }),
        ]),
        stats: {
          completed: 1,
          pending: 0,
          generating: 0,
          failed: 0,
        },
      })
      expect(result[0].last_plan_date).toBeDefined()
    })

    it('should group multiple plans under same client', async () => {
      // Create test client
      const { data: client } = await supabase
        .from('clients')
        .insert({
          trainer_id: userId,
          name: 'Test Client Multiple',
          form_data: {
            age: 25,
            gender: 'F',
            height: 165,
            weight: 60,
            ideal_weight: 58,
            activity_level: 'lightly_active',
            goal: 'fat_loss',
            dietary_type: 'vegan',
            budget: 50,
            cooking_skill: 'beginner',
            prep_time: 20,
            meals_per_day: 3,
            plan_duration: 7,
            meal_prep_style: 'daily',
          },
        })
        .select()
        .single()

      testClientIds.push(client.id)

      // Create multiple plans with different statuses
      const plans = await supabase
        .from('plans')
        .insert([
          {
            trainer_id: userId,
            client_id: client.id,
            status: 'completed' as PlanStatus,
            tokens_used: 1500,
            generation_cost: 0.075,
          },
          {
            trainer_id: userId,
            client_id: client.id,
            status: 'pending' as PlanStatus,
            tokens_used: 0,
            generation_cost: 0,
          },
          {
            trainer_id: userId,
            client_id: client.id,
            status: 'failed' as PlanStatus,
            tokens_used: 500,
            generation_cost: 0.025,
          },
        ])
        .select()

      plans.data?.forEach((p) => testPlanIds.push(p.id))

      // Test
      const result = await getPlansGroupedByClient(supabase, userId)

      const clientGroup = result.find((c) => c.client_id === client.id)

      expect(clientGroup).toBeDefined()
      expect(clientGroup!.plan_count).toBe(3)
      expect(clientGroup!.plans).toHaveLength(3)
      expect(clientGroup!.stats).toEqual({
        completed: 1,
        pending: 1,
        generating: 0,
        failed: 1,
      })
    })

    it('should calculate statistics correctly for each client', async () => {
      // Create client with mixed plan statuses
      const { data: client } = await supabase
        .from('clients')
        .insert({
          trainer_id: userId,
          name: 'Test Client Stats',
          form_data: {
            age: 35,
            gender: 'M',
            height: 175,
            weight: 85,
            ideal_weight: 78,
            activity_level: 'very_active',
            goal: 'muscle_gain',
            dietary_type: 'omnivore',
            budget: 100,
            cooking_skill: 'advanced',
            prep_time: 60,
            meals_per_day: 5,
            plan_duration: 14,
            meal_prep_style: 'mixed',
          },
        })
        .select()
        .single()

      testClientIds.push(client.id)

      // Create plans: 2 completed, 1 pending, 1 generating, 1 failed
      const plans = await supabase
        .from('plans')
        .insert([
          { trainer_id: userId, client_id: client.id, status: 'completed' as PlanStatus },
          { trainer_id: userId, client_id: client.id, status: 'completed' as PlanStatus },
          { trainer_id: userId, client_id: client.id, status: 'pending' as PlanStatus },
          { trainer_id: userId, client_id: client.id, status: 'generating' as PlanStatus },
          { trainer_id: userId, client_id: client.id, status: 'failed' as PlanStatus },
        ])
        .select()

      plans.data?.forEach((p) => testPlanIds.push(p.id))

      // Test
      const result = await getPlansGroupedByClient(supabase, userId)

      const clientGroup = result.find((c) => c.client_id === client.id)

      expect(clientGroup!.stats).toEqual({
        completed: 2,
        pending: 1,
        generating: 1,
        failed: 1,
      })
      expect(clientGroup!.plan_count).toBe(5)
    })

    it('should sort clients by last_plan_date (most recent first)', async () => {
      // Create three clients with plans at different times
      const clients = await supabase
        .from('clients')
        .insert([
          {
            trainer_id: userId,
            name: 'Old Client',
            form_data: {
              age: 30,
              gender: 'M',
              height: 180,
              weight: 80,
              ideal_weight: 75,
              activity_level: 'moderately_active',
              goal: 'fat_loss',
              dietary_type: 'omnivore',
              budget: 70,
              cooking_skill: 'intermediate',
              prep_time: 30,
              meals_per_day: 3,
              plan_duration: 7,
              meal_prep_style: 'batch',
            },
          },
          {
            trainer_id: userId,
            name: 'Recent Client',
            form_data: {
              age: 30,
              gender: 'M',
              height: 180,
              weight: 80,
              ideal_weight: 75,
              activity_level: 'moderately_active',
              goal: 'fat_loss',
              dietary_type: 'omnivore',
              budget: 70,
              cooking_skill: 'intermediate',
              prep_time: 30,
              meals_per_day: 3,
              plan_duration: 7,
              meal_prep_style: 'batch',
            },
          },
          {
            trainer_id: userId,
            name: 'Middle Client',
            form_data: {
              age: 30,
              gender: 'M',
              height: 180,
              weight: 80,
              ideal_weight: 75,
              activity_level: 'moderately_active',
              goal: 'fat_loss',
              dietary_type: 'omnivore',
              budget: 70,
              cooking_skill: 'intermediate',
              prep_time: 30,
              meals_per_day: 3,
              plan_duration: 7,
              meal_prep_style: 'batch',
            },
          },
        ])
        .select()

      clients.data?.forEach((c) => testClientIds.push(c.id))

      // Create plans with different timestamps (simulating different creation times)
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 30) // 30 days ago

      const middleDate = new Date()
      middleDate.setDate(middleDate.getDate() - 7) // 7 days ago

      const recentDate = new Date() // Today

      await supabase.from('plans').insert([
        {
          trainer_id: userId,
          client_id: clients.data![0].id,
          status: 'completed' as PlanStatus,
          created_at: oldDate.toISOString(),
        },
        {
          trainer_id: userId,
          client_id: clients.data![1].id,
          status: 'completed' as PlanStatus,
          created_at: recentDate.toISOString(),
        },
        {
          trainer_id: userId,
          client_id: clients.data![2].id,
          status: 'completed' as PlanStatus,
          created_at: middleDate.toISOString(),
        },
      ])

      // Update plan IDs for cleanup (get all plans for these clients)
      const { data: allPlans } = await supabase
        .from('plans')
        .select('id')
        .in('client_id', clients.data!.map((c) => c.id))

      allPlans?.forEach((p) => testPlanIds.push(p.id))

      // Test
      const result = await getPlansGroupedByClient(supabase, userId)

      const sortedClients = result.filter((c) =>
        ['Old Client', 'Recent Client', 'Middle Client'].includes(c.client_name)
      )

      // Should be sorted: Recent, Middle, Old
      expect(sortedClients[0].client_name).toBe('Recent Client')
      expect(sortedClients[1].client_name).toBe('Middle Client')
      expect(sortedClients[2].client_name).toBe('Old Client')

      // Verify dates are actually in descending order
      const date1 = new Date(sortedClients[0].last_plan_date)
      const date2 = new Date(sortedClients[1].last_plan_date)
      const date3 = new Date(sortedClients[2].last_plan_date)

      expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime())
      expect(date2.getTime()).toBeGreaterThanOrEqual(date3.getTime())
    })

    it('should enforce RLS - only return plans for the authenticated user', async () => {
      // Create client and plan for first user
      const { data: userClient } = await supabase
        .from('clients')
        .insert({
          trainer_id: userId,
          name: 'User Client',
          form_data: {
            age: 30,
            gender: 'M',
            height: 180,
            weight: 80,
            ideal_weight: 75,
            activity_level: 'moderately_active',
            goal: 'fat_loss',
            dietary_type: 'omnivore',
            budget: 70,
            cooking_skill: 'intermediate',
            prep_time: 30,
            meals_per_day: 3,
            plan_duration: 7,
            meal_prep_style: 'batch',
          },
        })
        .select()
        .single()

      testClientIds.push(userClient.id)

      const { data: userPlan } = await supabase
        .from('plans')
        .insert({
          trainer_id: userId,
          client_id: userClient.id,
          status: 'completed',
        })
        .select()
        .single()

      testPlanIds.push(userPlan.id)

      // Create client and plan for other user
      const { data: otherClient } = await supabase
        .from('clients')
        .insert({
          trainer_id: otherUserId,
          name: 'Other User Client',
          form_data: {
            age: 25,
            gender: 'F',
            height: 165,
            weight: 60,
            ideal_weight: 58,
            activity_level: 'lightly_active',
            goal: 'fat_loss',
            dietary_type: 'vegan',
            budget: 50,
            cooking_skill: 'beginner',
            prep_time: 20,
            meals_per_day: 3,
            plan_duration: 7,
            meal_prep_style: 'daily',
          },
        })
        .select()
        .single()

      testClientIds.push(otherClient.id)

      const { data: otherPlan } = await supabase
        .from('plans')
        .insert({
          trainer_id: otherUserId,
          client_id: otherClient.id,
          status: 'completed',
        })
        .select()
        .single()

      testPlanIds.push(otherPlan.id)

      // Test: Query as first user should only return their plans
      const userResult = await getPlansGroupedByClient(supabase, userId)
      const otherResult = await getPlansGroupedByClient(supabase, otherUserId)

      // First user should only see their client
      const userClients = userResult.filter((c) =>
        ['User Client', 'Other User Client'].includes(c.client_name)
      )
      expect(userClients).toHaveLength(1)
      expect(userClients[0].client_name).toBe('User Client')

      // Other user should only see their client
      const otherClients = otherResult.filter((c) =>
        ['User Client', 'Other User Client'].includes(c.client_name)
      )
      expect(otherClients).toHaveLength(1)
      expect(otherClients[0].client_name).toBe('Other User Client')
    })

    it('should include all required plan fields', async () => {
      // Create test data
      const { data: client } = await supabase
        .from('clients')
        .insert({
          trainer_id: userId,
          name: 'Field Test Client',
          form_data: {
            age: 30,
            gender: 'M',
            height: 180,
            weight: 80,
            ideal_weight: 75,
            activity_level: 'moderately_active',
            goal: 'fat_loss',
            dietary_type: 'omnivore',
            budget: 70,
            cooking_skill: 'intermediate',
            prep_time: 30,
            meals_per_day: 3,
            plan_duration: 7,
            meal_prep_style: 'batch',
          },
        })
        .select()
        .single()

      testClientIds.push(client.id)

      const { data: plan } = await supabase
        .from('plans')
        .insert({
          trainer_id: userId,
          client_id: client.id,
          status: 'completed',
          tokens_used: 2500,
          generation_cost: 0.125,
        })
        .select()
        .single()

      testPlanIds.push(plan.id)

      // Test
      const result = await getPlansGroupedByClient(supabase, userId)

      const clientGroup = result.find((c) => c.client_id === client.id)
      const planData = clientGroup!.plans[0]

      // Verify all required fields are present
      expect(planData).toHaveProperty('id')
      expect(planData).toHaveProperty('status')
      expect(planData).toHaveProperty('created_at')
      expect(planData).toHaveProperty('updated_at')
      expect(planData).toHaveProperty('tokens_used')
      expect(planData).toHaveProperty('generation_cost')

      // Verify values match
      expect(planData.id).toBe(plan.id)
      expect(planData.status).toBe('completed')
      expect(planData.tokens_used).toBe(2500)
      expect(planData.generation_cost).toBe(0.125)
    })

    it('should handle clients with no plans gracefully', async () => {
      // This tests the inner join behavior - clients without plans should NOT appear
      // because we use clients!inner which only returns plans that have a matching client

      // Create a client with NO plans
      const { data: emptyClient } = await supabase
        .from('clients')
        .insert({
          trainer_id: userId,
          name: 'Empty Client',
          form_data: {
            age: 30,
            gender: 'M',
            height: 180,
            weight: 80,
            ideal_weight: 75,
            activity_level: 'moderately_active',
            goal: 'fat_loss',
            dietary_type: 'omnivore',
            budget: 70,
            cooking_skill: 'intermediate',
            prep_time: 30,
            meals_per_day: 3,
            plan_duration: 7,
            meal_prep_style: 'batch',
          },
        })
        .select()
        .single()

      testClientIds.push(emptyClient.id)

      // Test
      const result = await getPlansGroupedByClient(supabase, userId)

      // Client with no plans should NOT appear (inner join filters them out)
      const emptyClientGroup = result.find((c) => c.client_id === emptyClient.id)
      expect(emptyClientGroup).toBeUndefined()
    })
  })
})
