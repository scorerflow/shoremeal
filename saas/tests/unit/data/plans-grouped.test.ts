/**
 * Unit tests for plans-grouped data layer (MOCKED - no real database calls)
 */

import { describe, it, expect, vi } from 'vitest'
import { getPlansGroupedByClient } from '@/lib/data/plans-grouped'
import type { SupabaseClient } from '@supabase/supabase-js'

function createMockSupabase(data: any[], error: any = null) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn().mockResolvedValue({ data, error }),
          })),
        })),
      })),
    })),
  } as any as SupabaseClient
}

describe('Plans Grouped by Client (Unit - Mocked)', () => {
  describe('getPlansGroupedByClient', () => {
    it('should return empty groups when no clients exist', async () => {
      const mockSupabase = createMockSupabase([])

      const result = await getPlansGroupedByClient(mockSupabase, 'user-123')

      expect(result).toEqual({ groups: [], hasMore: false })
    })

    it('should group plans by client correctly', async () => {
      const mockData = [
        {
          id: 'plan-1',
          client_id: 'client-1',
          status: 'completed',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T01:00:00Z',
          tokens_used: 1000,
          generation_cost: 0.05,
          clients: { id: 'client-1', name: 'John Doe' },
        },
        {
          id: 'plan-2',
          client_id: 'client-1',
          status: 'pending',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T01:00:00Z',
          tokens_used: 0,
          generation_cost: 0,
          clients: { id: 'client-1', name: 'John Doe' },
        },
      ]

      const mockSupabase = createMockSupabase(mockData)

      const result = await getPlansGroupedByClient(mockSupabase, 'user-123')

      expect(result.hasMore).toBe(false)
      expect(result.groups).toHaveLength(1)
      expect(result.groups[0]).toMatchObject({
        client_id: 'client-1',
        client_name: 'John Doe',
        plan_count: 2,
      })
      expect(result.groups[0].plans).toHaveLength(2)
      expect(result.groups[0].stats).toEqual({
        completed: 1,
        pending: 1,
        generating: 0,
        failed: 0,
      })
    })

    it('should handle multiple clients', async () => {
      const mockData = [
        {
          id: 'plan-1',
          client_id: 'client-1',
          status: 'completed',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T01:00:00Z',
          tokens_used: 1000,
          generation_cost: 0.05,
          clients: { id: 'client-1', name: 'John Doe' },
        },
        {
          id: 'plan-2',
          client_id: 'client-2',
          status: 'generating',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T01:00:00Z',
          tokens_used: 500,
          generation_cost: 0.025,
          clients: { id: 'client-2', name: 'Jane Smith' },
        },
      ]

      const mockSupabase = createMockSupabase(mockData)

      const result = await getPlansGroupedByClient(mockSupabase, 'user-123')

      expect(result.groups).toHaveLength(2)
      // Sorted by last_plan_date descending (most recent first)
      expect(result.groups[0].client_name).toBe('Jane Smith')
      expect(result.groups[1].client_name).toBe('John Doe')
    })

    it('should calculate stats correctly for multiple statuses', async () => {
      const mockData = [
        {
          id: 'plan-1',
          client_id: 'client-1',
          status: 'completed',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T01:00:00Z',
          tokens_used: 1000,
          generation_cost: 0.05,
          clients: { id: 'client-1', name: 'John Doe' },
        },
        {
          id: 'plan-2',
          client_id: 'client-1',
          status: 'completed',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T01:00:00Z',
          tokens_used: 800,
          generation_cost: 0.04,
          clients: { id: 'client-1', name: 'John Doe' },
        },
        {
          id: 'plan-3',
          client_id: 'client-1',
          status: 'generating',
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-03T01:00:00Z',
          tokens_used: 0,
          generation_cost: 0,
          clients: { id: 'client-1', name: 'John Doe' },
        },
        {
          id: 'plan-4',
          client_id: 'client-1',
          status: 'failed',
          created_at: '2024-01-04T00:00:00Z',
          updated_at: '2024-01-04T01:00:00Z',
          tokens_used: 200,
          generation_cost: 0.01,
          clients: { id: 'client-1', name: 'John Doe' },
        },
      ]

      const mockSupabase = createMockSupabase(mockData)

      const result = await getPlansGroupedByClient(mockSupabase, 'user-123')

      expect(result.groups[0].stats).toEqual({
        completed: 2,
        pending: 0,
        generating: 1,
        failed: 1,
      })
    })

    it('should set hasMore when results exceed limit', async () => {
      // Create limit+1 plans (default limit=200, but we use a small limit for testing)
      const mockData = [
        {
          id: 'plan-1',
          client_id: 'client-1',
          status: 'completed',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T01:00:00Z',
          tokens_used: 100,
          generation_cost: 0.01,
          clients: { id: 'client-1', name: 'John Doe' },
        },
        {
          id: 'plan-2',
          client_id: 'client-1',
          status: 'completed',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T01:00:00Z',
          tokens_used: 100,
          generation_cost: 0.01,
          clients: { id: 'client-1', name: 'John Doe' },
        },
        {
          id: 'plan-3',
          client_id: 'client-1',
          status: 'completed',
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-03T01:00:00Z',
          tokens_used: 100,
          generation_cost: 0.01,
          clients: { id: 'client-1', name: 'John Doe' },
        },
      ]

      // Pass limit=2, so 3 results > limit → hasMore=true, trimmed to 2
      const mockSupabase = createMockSupabase(mockData)

      const result = await getPlansGroupedByClient(mockSupabase, 'user-123', 2)

      expect(result.hasMore).toBe(true)
      expect(result.groups[0].plan_count).toBe(2)
      expect(result.groups[0].plans).toHaveLength(2)
    })

    it('should not set hasMore when results equal limit', async () => {
      const mockData = [
        {
          id: 'plan-1',
          client_id: 'client-1',
          status: 'completed',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T01:00:00Z',
          tokens_used: 100,
          generation_cost: 0.01,
          clients: { id: 'client-1', name: 'John Doe' },
        },
        {
          id: 'plan-2',
          client_id: 'client-1',
          status: 'completed',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T01:00:00Z',
          tokens_used: 100,
          generation_cost: 0.01,
          clients: { id: 'client-1', name: 'John Doe' },
        },
      ]

      const mockSupabase = createMockSupabase(mockData)

      const result = await getPlansGroupedByClient(mockSupabase, 'user-123', 2)

      expect(result.hasMore).toBe(false)
      expect(result.groups[0].plan_count).toBe(2)
    })

    it('should throw error on database error', async () => {
      const mockSupabase = createMockSupabase(null, { message: 'DB error' })

      await expect(
        getPlansGroupedByClient(mockSupabase, 'user-123')
      ).rejects.toThrow('Failed to fetch plans: DB error')
    })
  })
})
