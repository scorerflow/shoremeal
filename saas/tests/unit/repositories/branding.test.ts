/**
 * Unit tests for branding repository (MOCKED - no real database calls)
 *
 * These tests verify repository logic in isolation by mocking the Supabase client.
 * Integration tests verify actual database behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateBranding, getBrandingByTrainer } from '@/lib/repositories/branding'
import type { SupabaseClient } from '@supabase/supabase-js'

describe('Branding Repository (Unit - Mocked)', () => {
  let mockSupabase: SupabaseClient

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    } as any
  })

  describe('updateBranding', () => {
    it('should include logo_url in update when provided', async () => {
      const updateMock = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }))
      mockSupabase.from = vi.fn(() => ({ update: updateMock })) as any

      await updateBranding(mockSupabase, 'user-123', {
        logo_url: 'data:image/png;base64,test',
        primary_colour: '#FF0000',
        secondary_colour: '#00FF00',
        accent_colour: '#0000FF',
      })

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          logo_url: 'data:image/png;base64,test',
          primary_colour: '#FF0000',
          secondary_colour: '#00FF00',
          accent_colour: '#0000FF',
        })
      )
    })

    it('should include logo_url when explicitly set to null', async () => {
      const updateMock = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }))
      mockSupabase.from = vi.fn(() => ({ update: updateMock })) as any

      await updateBranding(mockSupabase, 'user-123', {
        logo_url: null,
        primary_colour: '#FF0000',
        secondary_colour: '#00FF00',
        accent_colour: '#0000FF',
      })

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          logo_url: null,
        })
      )
    })

    it('should NOT include logo_url when undefined', async () => {
      const updateMock = vi.fn((_data: Record<string, unknown>) => ({ eq: vi.fn().mockResolvedValue({ error: null }) }))
      mockSupabase.from = vi.fn(() => ({ update: updateMock })) as any

      await updateBranding(mockSupabase, 'user-123', {
        primary_colour: '#FF0000',
        secondary_colour: '#00FF00',
        accent_colour: '#0000FF',
      })

      const updateCall = updateMock.mock.calls[0][0]
      expect(updateCall).not.toHaveProperty('logo_url')
      expect(updateCall).toHaveProperty('primary_colour', '#FF0000')
    })

    it('should always include updated_at timestamp', async () => {
      const updateMock = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }))
      mockSupabase.from = vi.fn(() => ({ update: updateMock })) as any

      await updateBranding(mockSupabase, 'user-123', {
        primary_colour: '#FF0000',
        secondary_colour: '#00FF00',
        accent_colour: '#0000FF',
      })

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          updated_at: expect.any(String),
        })
      )
    })

    it('should filter by trainer_id', async () => {
      const eqMock = vi.fn().mockResolvedValue({ error: null })
      const updateMock = vi.fn(() => ({ eq: eqMock }))
      mockSupabase.from = vi.fn(() => ({ update: updateMock })) as any

      await updateBranding(mockSupabase, 'user-123', {
        primary_colour: '#FF0000',
        secondary_colour: '#00FF00',
        accent_colour: '#0000FF',
      })

      expect(eqMock).toHaveBeenCalledWith('trainer_id', 'user-123')
    })

    it('should throw error when update fails', async () => {
      const updateMock = vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: { message: 'Database error' } }),
      }))
      mockSupabase.from = vi.fn(() => ({ update: updateMock })) as any

      await expect(
        updateBranding(mockSupabase, 'user-123', {
          primary_colour: '#FF0000',
          secondary_colour: '#00FF00',
          accent_colour: '#0000FF',
        })
      ).rejects.toThrow('Failed to update branding: Database error')
    })
  })

  describe('getBrandingByTrainer', () => {
    it('should return branding data when found', async () => {
      const mockBranding = {
        id: 'brand-123',
        trainer_id: 'user-123',
        logo_url: 'data:image/png;base64,test',
        primary_colour: '#FF0000',
        secondary_colour: '#00FF00',
        accent_colour: '#0000FF',
      }

      const singleMock = vi.fn().mockResolvedValue({ data: mockBranding, error: null })
      const eqMock = vi.fn(() => ({ single: singleMock }))
      const selectMock = vi.fn(() => ({ eq: eqMock }))
      mockSupabase.from = vi.fn(() => ({ select: selectMock })) as any

      const result = await getBrandingByTrainer(mockSupabase, 'user-123')

      expect(selectMock).toHaveBeenCalledWith('*')
      expect(eqMock).toHaveBeenCalledWith('trainer_id', 'user-123')
      expect(result).toEqual(mockBranding)
    })

    it('should return null when not found', async () => {
      const singleMock = vi.fn().mockResolvedValue({ data: null, error: null })
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: singleMock })),
        })),
      })) as any

      const result = await getBrandingByTrainer(mockSupabase, 'user-123')

      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      const singleMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: singleMock })),
        })),
      })) as any

      const result = await getBrandingByTrainer(mockSupabase, 'user-123')

      expect(result).toBeNull()
    })
  })
})
