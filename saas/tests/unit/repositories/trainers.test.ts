/**
 * Unit tests for trainers repository (MOCKED - no real database calls)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateTrainerProfile } from '@/lib/repositories/trainers'
import type { SupabaseClient } from '@supabase/supabase-js'

describe('Trainers Repository (Unit - Mocked)', () => {
  let mockSupabase: SupabaseClient

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
        })),
      })),
    } as any
  })

  describe('updateTrainerProfile', () => {
    it('should update full_name and business_name', async () => {
      const mockTrainer = {
        id: 'user-123',
        full_name: 'Jane Smith',
        business_name: 'FitCo',
        email: 'jane@test.com',
      }

      const singleMock = vi.fn().mockResolvedValue({ data: mockTrainer, error: null })
      const selectMock = vi.fn(() => ({ single: singleMock }))
      const eqMock = vi.fn(() => ({ select: selectMock }))
      const updateMock = vi.fn(() => ({ eq: eqMock }))
      mockSupabase.from = vi.fn(() => ({ update: updateMock })) as any

      const result = await updateTrainerProfile(mockSupabase, 'user-123', {
        full_name: 'Jane Smith',
        business_name: 'FitCo',
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('trainers')
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: 'Jane Smith',
          business_name: 'FitCo',
        })
      )
      expect(eqMock).toHaveBeenCalledWith('id', 'user-123')
      expect(selectMock).toHaveBeenCalledWith('*')
      expect(result).toEqual(mockTrainer)
    })

    it('should set business_name to null when not provided', async () => {
      const mockTrainer = {
        id: 'user-123',
        full_name: 'Jane Smith',
        business_name: null,
      }

      const singleMock = vi.fn().mockResolvedValue({ data: mockTrainer, error: null })
      const selectMock = vi.fn(() => ({ single: singleMock }))
      const eqMock = vi.fn(() => ({ select: selectMock }))
      const updateMock = vi.fn(() => ({ eq: eqMock }))
      mockSupabase.from = vi.fn(() => ({ update: updateMock })) as any

      await updateTrainerProfile(mockSupabase, 'user-123', {
        full_name: 'Jane Smith',
      })

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: 'Jane Smith',
          business_name: null,
        })
      )
    })

    it('should include updated_at timestamp', async () => {
      const singleMock = vi.fn().mockResolvedValue({ data: { id: 'user-123' }, error: null })
      const selectMock = vi.fn(() => ({ single: singleMock }))
      const eqMock = vi.fn(() => ({ select: selectMock }))
      const updateMock = vi.fn(() => ({ eq: eqMock }))
      mockSupabase.from = vi.fn(() => ({ update: updateMock })) as any

      await updateTrainerProfile(mockSupabase, 'user-123', {
        full_name: 'Jane Smith',
      })

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          updated_at: expect.any(String),
        })
      )
    })

    it('should throw error when database update fails', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })
      const selectMock = vi.fn(() => ({ single: singleMock }))
      const eqMock = vi.fn(() => ({ select: selectMock }))
      const updateMock = vi.fn(() => ({ eq: eqMock }))
      mockSupabase.from = vi.fn(() => ({ update: updateMock })) as any

      await expect(
        updateTrainerProfile(mockSupabase, 'user-123', {
          full_name: 'Jane Smith',
        })
      ).rejects.toThrow('Failed to update profile: Database error')
    })
  })
})
