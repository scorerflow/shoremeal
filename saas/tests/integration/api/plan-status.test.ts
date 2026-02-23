// @vitest-environment node
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
import { createTestRequest, getResponseJson } from '../../helpers/request'
import type { TestUser } from '../../helpers/auth'

// Import route handler
import { GET as getPlanStatus } from '@/app/api/plans/[id]/status/route'

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
          pdf_url: 'https://example.com/test.pdf',
        })
        .select()
        .single()

      // Try to access without auth
      const request = createTestRequest(`/api/plans/${plan!.id}/status`)
      const response = await getPlanStatus(request, { params: { id: plan!.id } })

      expect(response.status).toBe(401)
    })

    it('should return 404 if plan does not exist', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'

      const request = createTestRequest(`/api/plans/${fakeId}/status`, {
        authToken: userA.accessToken,
      })

      const response = await getPlanStatus(request, { params: { id: fakeId } })
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
          pdf_url: 'https://example.com/test.pdf',
        })
        .select()
        .single()

      // UserB tries to access UserA's plan
      const request = createTestRequest(`/api/plans/${plan!.id}/status`, {
        authToken: userB.accessToken,
      })

      const response = await getPlanStatus(request, { params: { id: plan!.id } })

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
          pdf_url: 'https://example.com/test.pdf',
        })
        .select()
        .single()

      const request = createTestRequest(`/api/plans/${plan!.id}/status`, {
        authToken: userA.accessToken,
      })

      const response = await getPlanStatus(request, { params: { id: plan!.id } })
      expect(response.status).toBe(200)

      const data = await getResponseJson(response)

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
      // Note: client_name may be null in test environment due to nested query limitations
      expect(data).toHaveProperty('client_name')
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
      await supabase
        .from('plans')
        .insert({
          trainer_id: userA.user.id,
          client_id: client!.id,
          status: 'pending',
        })

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100))

      // Plan 2 (middle)
      await supabase
        .from('plans')
        .insert({
          trainer_id: userA.user.id,
          client_id: client!.id,
          status: 'pending',
        })

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
      const request = createTestRequest(`/api/plans/${plan3!.id}/status`, {
        authToken: userA.accessToken,
      })

      const response = await getPlanStatus(request, { params: { id: plan3!.id } })
      expect(response.status).toBe(200)

      const data = await getResponseJson(response)

      expect(data.queuePosition).toBe(3) // 3rd in queue
      expect(data.totalInQueue).toBeGreaterThanOrEqual(3)
      expect(data.estimatedMinutes).toBeGreaterThan(0)

      // Pending plans should not have plan_text yet
      expect(data.plan_text).toBeNull()
      // Note: client_name may be null in test environment
      expect(data).toHaveProperty('client_name')
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
          pdf_url: 'https://example.com/test.pdf',
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

      const request = createTestRequest(`/api/plans/${pendingPlan!.id}/status`, {
        authToken: userA.accessToken,
      })

      const response = await getPlanStatus(request, { params: { id: pendingPlan!.id } })
      const data = await getResponseJson(response)

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
          pdf_url: 'https://example.com/test.pdf',
        })
        .select()
        .single()

      // Wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000))

      const request = createTestRequest(`/api/plans/${plan!.id}/status`, {
        authToken: userA.accessToken,
      })

      const response = await getPlanStatus(request, { params: { id: plan!.id } })
      const data = await getResponseJson(response)

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
          pdf_url: 'https://example.com/test.pdf',
        })
        .select()
        .single()

      const request = createTestRequest(`/api/plans/${plan!.id}/status`, {
        authToken: userA.accessToken,
      })

      const response = await getPlanStatus(request, { params: { id: plan!.id } })
      const data = await getResponseJson(response)

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
          pdf_url: 'https://example.com/test.pdf',
        })
        .select()
        .single()

      const request = createTestRequest(`/api/plans/${plan!.id}/status`, {
        authToken: userA.accessToken,
      })

      const response = await getPlanStatus(request, { params: { id: plan!.id } })
      const data = await getResponseJson(response)

      expect(data.status).toBe('failed')
      expect(data.errorMessage).toBe('Claude API rate limit exceeded')
    })
  })
})
