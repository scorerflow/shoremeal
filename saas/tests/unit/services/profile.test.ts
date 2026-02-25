/**
 * Unit tests for profile service (MOCKED - no real database calls)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateTrainerProfile } from '@/lib/services/profile'
import type { SupabaseClient } from '@supabase/supabase-js'

vi.mock('@/lib/repositories/trainers', () => ({
  updateTrainerProfile: vi.fn(),
}))

import { updateTrainerProfile as updateProfileRepo } from '@/lib/repositories/trainers'

const mockUpdateProfile = updateProfileRepo as ReturnType<typeof vi.fn>

describe('Profile Service (Unit - Mocked)', () => {
  const mockSupabase = {} as SupabaseClient
  const userId = 'user-456'

  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateProfile.mockResolvedValue({
      id: userId,
      full_name: 'Jane Smith',
      business_name: 'FitCo',
    })
  })

  it('should call repository with correct args', async () => {
    await updateTrainerProfile(mockSupabase, userId, {
      full_name: 'Jane Smith',
      business_name: 'FitCo',
    })

    expect(mockUpdateProfile).toHaveBeenCalledWith(mockSupabase, userId, {
      full_name: 'Jane Smith',
      business_name: 'FitCo',
    })
  })

  it('should return { success: true } on success', async () => {
    const result = await updateTrainerProfile(mockSupabase, userId, {
      full_name: 'Jane Smith',
    })

    expect(result).toEqual({ success: true })
  })

  it('should pass through null business_name', async () => {
    await updateTrainerProfile(mockSupabase, userId, {
      full_name: 'Jane Smith',
      business_name: null,
    })

    expect(mockUpdateProfile).toHaveBeenCalledWith(mockSupabase, userId, {
      full_name: 'Jane Smith',
      business_name: null,
    })
  })

  it('should propagate repository errors', async () => {
    mockUpdateProfile.mockRejectedValue(new Error('Failed to update profile: Database error'))

    await expect(
      updateTrainerProfile(mockSupabase, userId, { full_name: 'Jane Smith' })
    ).rejects.toThrow('Failed to update profile: Database error')
  })
})
