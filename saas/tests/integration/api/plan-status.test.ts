/**
 * Plan Status API Tests
 *
 * Tests the /api/plans/[id]/status endpoint for:
 * - Authentication & authorization (security critical)
 * - Queue position calculation
 * - Time estimation
 * - Data isolation (users can only see their own plans)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestUser, deleteTestUser } from '../../helpers/auth'
import { createTestServiceClient } from '../../helpers/db'
import type { TestUser } from '../../helpers/auth'

describe('Plan Status API', () => {
  let userA: TestUser
  let userB: TestUser
  const supabase = createTestServiceClient()

  beforeEach(async () => {
    // Create two test users
    userA = await createTestUser()
    userB = await createTestUser()
  })

  afterEach(async () => {
    // Cleanup
    await deleteTestUser(userA.user.id)
    await deleteTestUser(userB.user.id)
  })

  describe('Authentication & Authorization', () => {
    it('should return 401 if not authenticated', async () => {
      // Create a plan for userA
      const { data: client } = await supabase
        .from('clients')
        .insert({
          trainer_id: userA.user.id,
          name: 'Test Client',
          email: 'test@example.com',
          form_data: { age: 30, gender: 'M' },
        })
        .select()
        .single()

      const { data: plan } = await supabase
        .from('plans')
        .insert({
          trainer_id: userA.user.id,
          client_id: client!.id,
          status: 'pending',
        })
        .select()
        .single()

      // Try to access without auth
      const response = await fetch(`http://localhost:3000/api/plans/${plan!.id}/status`)
      expect(response.status).toBe(401)
    })

    it('should return 404 if plan does not exist', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'

      const response = await fetch(`http://localhost:3000/api/plans/${fakeId}/status`, {
        headers: {
          'Authorization': `Bearer ${userA.accessToken}`,
        },
      })

      expect(response.status).toBe(404)
    })

    it('should return 403 if user tries to access another users plan', async () => {
      // UserA creates a plan
      const { data: client } = await supabase
        .from('clients')
        .insert({
          trainer_id: userA.user.id,
          name: 'Test Client A',
          email: 'testA@example.com',
          form_data: { age: 30, gender: 'M' },
        })
        .select()
        .single()

      const { data: plan } = await supabase
        .from('plans')
        .insert({
          trainer_id: userA.user.id,
          client_id: client!.id,
          status: 'pending',
        })
        .select()
        .single()

      // UserB tries to access UserA's plan
      const response = await fetch(`http://localhost:3000/api/plans/${plan!.id}/status`, {
        headers: {
          'Authorization': `Bearer ${userB.accessToken}`,
        },
      })

      // Should return 404 due to RLS (plan not found for userB)
      // Or 403 if we add explicit check
      expect([403, 404]).toContain(response.status)
    })
  })

  describe('Status & Queue Position', () => {
    it('should return status for completed plan with no queue info', async () => {
      // Create completed plan
      const { data: client } = await supabase
        .from('clients')
        .insert({
          trainer_id: userA.user.id,
          name: 'Test Client',
          email: 'test@example.com',
          form_data: { age: 30, gender: 'M' },
        })
        .select()
        .single()

      const { data: plan } = await supabase
        .from('plans')
        .insert({
          trainer_id: userA.user.id,
          client_id: client!.id,
          status: 'completed',
          plan_text: 'Mock plan content',
        })
        .select()
        .single()

      const response = await fetch(`http://localhost:3000/api/plans/${plan!.id}/status`, {
        headers: {
          'Authorization': `Bearer ${userA.accessToken}`,
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data).toMatchObject({
        id: plan!.id,
        status: 'completed',
        queuePosition: 0,
        totalInQueue: 0,
        estimatedMinutes: 0,
      })
      expect(data.elapsedSeconds).toBeGreaterThanOrEqual(0)

      // Critical: Verify plan data is returned (this would have caught the bug!)
      expect(data.plan_text).toBe('Mock plan content')
      expect(data.client_name).toBe('Test Client')
      expect(data.created_at).toBeDefined()
      expect(data.updated_at).toBeDefined()
    })

    it('should calculate queue position for pending plan', async () => {
      // Create 3 pending plans at different times
      const { data: client } = await supabase
        .from('clients')
        .insert({
          trainer_id: userA.user.id,
          name: 'Test Client',
          email: 'test@example.com',
          form_data: { age: 30, gender: 'M' },
        })
        .select()
        .single()

      // Plan 1 (oldest)
      const { data: plan1 } = await supabase
        .from('plans')
        .insert({
          trainer_id: userA.user.id,
          client_id: client!.id,
          status: 'pending',
        })
        .select()
        .single()

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100))

      // Plan 2 (middle)
      const { data: plan2 } = await supabase
        .from('plans')
        .insert({
          trainer_id: userA.user.id,
          client_id: client!.id,
          status: 'pending',
        })
        .select()
        .single()

      await new Promise(resolve => setTimeout(resolve, 100))

      // Plan 3 (newest - this one we'll check)
      const { data: plan3 } = await supabase
        .from('plans')
        .insert({
          trainer_id: userA.user.id,
          client_id: client!.id,
          status: 'pending',
        })
        .select()
        .single()

      // Check plan3's queue position (should be 3rd)
      const response = await fetch(`http://localhost:3000/api/plans/${plan3!.id}/status`, {
        headers: {
          'Authorization': `Bearer ${userA.accessToken}`,
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.queuePosition).toBe(3) // 3rd in queue
      expect(data.totalInQueue).toBeGreaterThanOrEqual(3)
      expect(data.estimatedMinutes).toBeGreaterThan(0)

      // Pending plans should not have plan_text yet
      expect(data.plan_text).toBeNull()
      expect(data.client_name).toBe('Test Client')
    })

    it('should include generating plans in queue count', async () => {
      const { data: client } = await supabase
        .from('clients')
        .insert({
          trainer_id: userA.user.id,
          name: 'Test Client',
          email: 'test@example.com',
          form_data: { age: 30, gender: 'M' },
        })
        .select()
        .single()

      // Create one generating plan
      await supabase
        .from('plans')
        .insert({
          trainer_id: userA.user.id,
          client_id: client!.id,
          status: 'generating',
        })

      // Create one pending plan (the one we'll check)
      const { data: pendingPlan } = await supabase
        .from('plans')
        .insert({
          trainer_id: userA.user.id,
          client_id: client!.id,
          status: 'pending',
        })
        .select()
        .single()

      const response = await fetch(`http://localhost:3000/api/plans/${pendingPlan!.id}/status`, {
        headers: {
          'Authorization': `Bearer ${userA.accessToken}`,
        },
      })

      const data = await response.json()

      // Should be 2nd in queue (after the generating one)
      expect(data.queuePosition).toBe(2)
      expect(data.totalInQueue).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Time Calculations', () => {
    it('should calculate elapsed time correctly', async () => {
      const { data: client } = await supabase
        .from('clients')
        .insert({
          trainer_id: userA.user.id,
          name: 'Test Client',
          email: 'test@example.com',
          form_data: { age: 30, gender: 'M' },
        })
        .select()
        .single()

      const { data: plan } = await supabase
        .from('plans')
        .insert({
          trainer_id: userA.user.id,
          client_id: client!.id,
          status: 'generating',
        })
        .select()
        .single()

      // Wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000))

      const response = await fetch(`http://localhost:3000/api/plans/${plan!.id}/status`, {
        headers: {
          'Authorization': `Bearer ${userA.accessToken}`,
        },
      })

      const data = await response.json()

      // Should be at least 2 seconds elapsed
      expect(data.elapsedSeconds).toBeGreaterThanOrEqual(2)
    })

    it('should estimate time based on queue position', async () => {
      const { data: client } = await supabase
        .from('clients')
        .insert({
          trainer_id: userA.user.id,
          name: 'Test Client',
          email: 'test@example.com',
          form_data: { age: 30, gender: 'M' },
        })
        .select()
        .single()

      // Create 10 pending plans ahead
      for (let i = 0; i < 10; i++) {
        await supabase.from('plans').insert({
          trainer_id: userA.user.id,
          client_id: client!.id,
          status: 'pending',
        })
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      // Create the plan we'll check (11th in queue)
      const { data: plan } = await supabase
        .from('plans')
        .insert({
          trainer_id: userA.user.id,
          client_id: client!.id,
          status: 'pending',
        })
        .select()
        .single()

      const response = await fetch(`http://localhost:3000/api/plans/${plan!.id}/status`, {
        headers: {
          'Authorization': `Bearer ${userA.accessToken}`,
        },
      })

      const data = await response.json()

      // With 10 plans ahead, should estimate > 0 minutes
      expect(data.estimatedMinutes).toBeGreaterThan(0)
      // But shouldn't be crazy high (sanity check)
      expect(data.estimatedMinutes).toBeLessThan(10)
    })
  })

  describe('Error Handling', () => {
    it('should include error message if plan failed', async () => {
      const { data: client } = await supabase
        .from('clients')
        .insert({
          trainer_id: userA.user.id,
          name: 'Test Client',
          email: 'test@example.com',
          form_data: { age: 30, gender: 'M' },
        })
        .select()
        .single()

      const { data: plan } = await supabase
        .from('plans')
        .insert({
          trainer_id: userA.user.id,
          client_id: client!.id,
          status: 'failed',
          error_message: 'Claude API rate limit exceeded',
        })
        .select()
        .single()

      const response = await fetch(`http://localhost:3000/api/plans/${plan!.id}/status`, {
        headers: {
          'Authorization': `Bearer ${userA.accessToken}`,
        },
      })

      const data = await response.json()

      expect(data.status).toBe('failed')
      expect(data.errorMessage).toBe('Claude API rate limit exceeded')
    })
  })
})
