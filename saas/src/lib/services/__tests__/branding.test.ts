import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateTrainerBranding } from '../branding'

// Mock dependencies
vi.mock('@/lib/repositories/branding', () => ({
  updateBranding: vi.fn(),
}))

import { updateBranding } from '@/lib/repositories/branding'

describe('updateTrainerBranding', () => {
  const mockSupabase = {} as any
  const userId = 'trainer-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update branding colors and return success', async () => {
    const colours = {
      primary_colour: '#FF5733',
      secondary_colour: '#33FF57',
      accent_colour: '#3357FF',
    }

    vi.mocked(updateBranding).mockResolvedValue()

    const result = await updateTrainerBranding(mockSupabase, userId, colours)

    expect(updateBranding).toHaveBeenCalledWith(mockSupabase, userId, colours)
    expect(result).toEqual({ success: true })
  })

  it('should pass all colour values to repository', async () => {
    const colours = {
      primary_colour: '#000000',
      secondary_colour: '#FFFFFF',
      accent_colour: '#888888',
    }

    vi.mocked(updateBranding).mockResolvedValue()

    await updateTrainerBranding(mockSupabase, userId, colours)

    expect(updateBranding).toHaveBeenCalledWith(
      mockSupabase,
      userId,
      expect.objectContaining({
        primary_colour: '#000000',
        secondary_colour: '#FFFFFF',
        accent_colour: '#888888',
      })
    )
  })

  it('should propagate errors from repository', async () => {
    const colours = {
      primary_colour: '#FF0000',
      secondary_colour: '#00FF00',
      accent_colour: '#0000FF',
    }

    const error = new Error('Database error')
    vi.mocked(updateBranding).mockRejectedValue(error)

    await expect(
      updateTrainerBranding(mockSupabase, userId, colours)
    ).rejects.toThrow('Database error')
  })
})
