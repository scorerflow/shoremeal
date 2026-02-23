// @vitest-environment node
/**
 * Unit tests for branding repository
 *
 * Tests updateBranding function with logo_url handling.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestUser, deleteTestUser } from '../../helpers/auth'
import { createTestServiceClient } from '../../helpers/db'
import type { TestUser } from '../../helpers/auth'
import { updateBranding, getBrandingByTrainer } from '@/lib/repositories/branding'

describe('Branding Repository - Logo Updates', () => {
  let user: TestUser
  const supabase = createTestServiceClient()

  beforeEach(async () => {
    user = await createTestUser()

    // Initialize branding record
    await supabase.from('branding').upsert({
      trainer_id: user.user.id,
      logo_url: null,
      primary_colour: '#2C5F2D',
      secondary_colour: '#4A7C4E',
      accent_colour: '#FF8C00',
    })
  })

  afterEach(async () => {
    await deleteTestUser(user.user.id)
  })

  describe('updateBranding - Logo Field', () => {
    it('should update logo_url when provided', async () => {
      await updateBranding(supabase, user.user.id, {
        logo_url: 'data:image/png;base64,test',
        primary_colour: '#2C5F2D',
        secondary_colour: '#4A7C4E',
        accent_colour: '#FF8C00',
      })

      const branding = await getBrandingByTrainer(supabase, user.user.id)
      expect(branding?.logo_url).toBe('data:image/png;base64,test')
    })

    it('should set logo_url to null when explicitly passed null', async () => {
      // Set initial logo
      await supabase
        .from('branding')
        .update({ logo_url: 'data:image/png;base64,existing' })
        .eq('trainer_id', user.user.id)

      // Remove logo
      await updateBranding(supabase, user.user.id, {
        logo_url: null,
        primary_colour: '#2C5F2D',
        secondary_colour: '#4A7C4E',
        accent_colour: '#FF8C00',
      })

      const branding = await getBrandingByTrainer(supabase, user.user.id)
      expect(branding?.logo_url).toBeNull()
    })

    it('should preserve existing logo_url when not provided', async () => {
      // Set initial logo
      await supabase
        .from('branding')
        .update({ logo_url: 'data:image/png;base64,existing' })
        .eq('trainer_id', user.user.id)

      // Update colors only (no logo_url in data)
      await updateBranding(supabase, user.user.id, {
        primary_colour: '#FF0000',
        secondary_colour: '#00FF00',
        accent_colour: '#0000FF',
      })

      const branding = await getBrandingByTrainer(supabase, user.user.id)
      expect(branding?.logo_url).toBe('data:image/png;base64,existing')
      expect(branding?.primary_colour).toBe('#FF0000')
    })

    it('should update logo and colors together', async () => {
      await updateBranding(supabase, user.user.id, {
        logo_url: 'data:image/png;base64,newlogo',
        primary_colour: '#AABBCC',
        secondary_colour: '#DDEEFF',
        accent_colour: '#112233',
      })

      const branding = await getBrandingByTrainer(supabase, user.user.id)
      expect(branding).toMatchObject({
        logo_url: 'data:image/png;base64,newlogo',
        primary_colour: '#AABBCC',
        secondary_colour: '#DDEEFF',
        accent_colour: '#112233',
      })
    })
  })

  describe('updateBranding - Colors Only', () => {
    it('should update all three colors', async () => {
      await updateBranding(supabase, user.user.id, {
        primary_colour: '#FF0000',
        secondary_colour: '#00FF00',
        accent_colour: '#0000FF',
      })

      const branding = await getBrandingByTrainer(supabase, user.user.id)
      expect(branding).toMatchObject({
        primary_colour: '#FF0000',
        secondary_colour: '#00FF00',
        accent_colour: '#0000FF',
      })
    })

    it('should update updated_at timestamp', async () => {
      const before = await getBrandingByTrainer(supabase, user.user.id)

      // Wait to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100))

      await updateBranding(supabase, user.user.id, {
        primary_colour: '#FF0000',
        secondary_colour: '#00FF00',
        accent_colour: '#0000FF',
      })

      const after = await getBrandingByTrainer(supabase, user.user.id)

      expect(new Date(after!.updated_at).getTime()).toBeGreaterThan(new Date(before!.updated_at).getTime())
    })
  })

  describe('Error Handling', () => {
    it('should silently succeed when updating non-existent trainer (Supabase behavior)', async () => {
      // Note: Supabase update() doesn't throw error for non-existent rows, just updates 0 rows
      // In production, branding records are created on trainer signup, so this won't happen
      await expect(
        updateBranding(supabase, '00000000-0000-0000-0000-000000000000', {
          primary_colour: '#FF0000',
          secondary_colour: '#00FF00',
          accent_colour: '#0000FF',
        })
      ).resolves.toBeUndefined()
    })
  })

  describe('Logo Data Integrity', () => {
    it('should handle long base64 strings', async () => {
      // Create a realistic-sized base64 string (simulate ~50KB image)
      const longBase64 = 'data:image/png;base64,' + 'A'.repeat(70000)

      await updateBranding(supabase, user.user.id, {
        logo_url: longBase64,
        primary_colour: '#2C5F2D',
        secondary_colour: '#4A7C4E',
        accent_colour: '#FF8C00',
      })

      const branding = await getBrandingByTrainer(supabase, user.user.id)
      expect(branding?.logo_url).toBe(longBase64)
      expect(branding?.logo_url?.length).toBe(longBase64.length)
    })

    it('should handle empty string as logo_url', async () => {
      await updateBranding(supabase, user.user.id, {
        logo_url: '',
        primary_colour: '#2C5F2D',
        secondary_colour: '#4A7C4E',
        accent_colour: '#FF8C00',
      })

      const branding = await getBrandingByTrainer(supabase, user.user.id)
      expect(branding?.logo_url).toBe('')
    })
  })

  describe('Multiple Updates', () => {
    it('should handle sequential logo updates', async () => {
      // First update
      await updateBranding(supabase, user.user.id, {
        logo_url: 'data:image/png;base64,first',
        primary_colour: '#FF0000',
        secondary_colour: '#00FF00',
        accent_colour: '#0000FF',
      })

      let branding = await getBrandingByTrainer(supabase, user.user.id)
      expect(branding?.logo_url).toBe('data:image/png;base64,first')

      // Second update
      await updateBranding(supabase, user.user.id, {
        logo_url: 'data:image/png;base64,second',
        primary_colour: '#AABBCC',
        secondary_colour: '#DDEEFF',
        accent_colour: '#112233',
      })

      branding = await getBrandingByTrainer(supabase, user.user.id)
      expect(branding?.logo_url).toBe('data:image/png;base64,second')
      expect(branding?.primary_colour).toBe('#AABBCC')

      // Third update - remove logo
      await updateBranding(supabase, user.user.id, {
        logo_url: null,
        primary_colour: '#FFFFFF',
        secondary_colour: '#000000',
        accent_colour: '#CCCCCC',
      })

      branding = await getBrandingByTrainer(supabase, user.user.id)
      expect(branding?.logo_url).toBeNull()
      expect(branding?.primary_colour).toBe('#FFFFFF')
    })
  })
})
