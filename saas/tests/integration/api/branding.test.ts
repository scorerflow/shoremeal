// @vitest-environment node
/**
 * Integration tests for PUT /api/branding
 *
 * Tests logo upload, color updates, validation, and RLS enforcement.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestUser, deleteTestUser } from '../../helpers/auth'
import { createTestServiceClient } from '../../helpers/db'
import { createTestRequest } from '../../helpers/request'
import type { TestUser } from '../../helpers/auth'
import { PUT as updateBranding } from '@/app/api/branding/route'

const dbAvailable = process.env.INTEGRATION_DB_AVAILABLE === 'true'

describe.runIf(dbAvailable)('PUT /api/branding - Logo & Colors Update', () => {
  let user: TestUser
  const supabase = createTestServiceClient()

  beforeEach(async () => {
    user = await createTestUser()

    // Set active subscription (required to update branding)
    await supabase
      .from('trainers')
      .update({ subscription_tier: 'pro', subscription_status: 'active' })
      .eq('id', user.user.id)

    // Initialize branding record with defaults
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

  describe('Logo Upload', () => {
    it('should save logo as base64 data URL', async () => {
      const logoData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

      const request = createTestRequest('/api/branding', {
        method: 'PUT',
        body: {
          logo_url: logoData,
          primary_colour: '#2C5F2D',
          secondary_colour: '#4A7C4E',
          accent_colour: '#FF8C00',
        },
        authToken: user.accessToken,
      })

      const response = await updateBranding(request)
      expect(response.status).toBe(200)

      // Verify logo was saved
      const { data: branding } = await supabase
        .from('branding')
        .select('logo_url')
        .eq('trainer_id', user.user.id)
        .single()

      expect(branding?.logo_url).toBe(logoData)
    })

    it('should update existing logo with new logo', async () => {
      const oldLogo = 'data:image/png;base64,old'
      const newLogo = 'data:image/png;base64,new'

      // Set initial logo
      await supabase
        .from('branding')
        .update({ logo_url: oldLogo })
        .eq('trainer_id', user.user.id)

      // Update with new logo
      const request = createTestRequest('/api/branding', {
        method: 'PUT',
        body: {
          logo_url: newLogo,
          primary_colour: '#2C5F2D',
          secondary_colour: '#4A7C4E',
          accent_colour: '#FF8C00',
        },
        authToken: user.accessToken,
      })

      const response = await updateBranding(request)
      expect(response.status).toBe(200)

      // Verify new logo was saved
      const { data: branding } = await supabase
        .from('branding')
        .select('logo_url')
        .eq('trainer_id', user.user.id)
        .single()

      expect(branding?.logo_url).toBe(newLogo)
    })

    it('should remove logo when logo_url is null', async () => {
      // Set initial logo
      await supabase
        .from('branding')
        .update({ logo_url: 'data:image/png;base64,existing' })
        .eq('trainer_id', user.user.id)

      // Remove logo by setting to null
      const request = createTestRequest('/api/branding', {
        method: 'PUT',
        body: {
          logo_url: null,
          primary_colour: '#2C5F2D',
          secondary_colour: '#4A7C4E',
          accent_colour: '#FF8C00',
        },
        authToken: user.accessToken,
      })

      const response = await updateBranding(request)
      expect(response.status).toBe(200)

      // Verify logo was removed
      const { data: branding } = await supabase
        .from('branding')
        .select('logo_url')
        .eq('trainer_id', user.user.id)
        .single()

      expect(branding?.logo_url).toBeNull()
    })

    it('should preserve logo when logo_url is not provided', async () => {
      const existingLogo = 'data:image/png;base64,existing'

      // Set initial logo
      await supabase
        .from('branding')
        .update({ logo_url: existingLogo })
        .eq('trainer_id', user.user.id)

      // Update colors only (no logo_url field)
      const request = createTestRequest('/api/branding', {
        method: 'PUT',
        body: {
          primary_colour: '#FF0000',
          secondary_colour: '#00FF00',
          accent_colour: '#0000FF',
        },
        authToken: user.accessToken,
      })

      const response = await updateBranding(request)
      expect(response.status).toBe(200)

      // Verify logo was preserved
      const { data: branding } = await supabase
        .from('branding')
        .select('*')
        .eq('trainer_id', user.user.id)
        .single()

      expect(branding?.logo_url).toBe(existingLogo)
      expect(branding?.primary_colour).toBe('#FF0000')
    })
  })

  describe('Color Updates', () => {
    it('should update all three colors', async () => {
      const request = createTestRequest('/api/branding', {
        method: 'PUT',
        body: {
          primary_colour: '#FF0000',
          secondary_colour: '#00FF00',
          accent_colour: '#0000FF',
        },
        authToken: user.accessToken,
      })

      const response = await updateBranding(request)
      expect(response.status).toBe(200)

      const { data: branding } = await supabase
        .from('branding')
        .select('primary_colour, secondary_colour, accent_colour')
        .eq('trainer_id', user.user.id)
        .single()

      expect(branding).toMatchObject({
        primary_colour: '#FF0000',
        secondary_colour: '#00FF00',
        accent_colour: '#0000FF',
      })
    })

    it('should update logo and colors together', async () => {
      const request = createTestRequest('/api/branding', {
        method: 'PUT',
        body: {
          logo_url: 'data:image/png;base64,test',
          primary_colour: '#AABBCC',
          secondary_colour: '#DDEEFF',
          accent_colour: '#112233',
        },
        authToken: user.accessToken,
      })

      const response = await updateBranding(request)
      expect(response.status).toBe(200)

      const { data: branding } = await supabase
        .from('branding')
        .select('*')
        .eq('trainer_id', user.user.id)
        .single()

      expect(branding).toMatchObject({
        logo_url: 'data:image/png;base64,test',
        primary_colour: '#AABBCC',
        secondary_colour: '#DDEEFF',
        accent_colour: '#112233',
      })
    })
  })

  describe('Validation', () => {
    it('should reject invalid hex color (primary)', async () => {
      const request = createTestRequest('/api/branding', {
        method: 'PUT',
        body: {
          primary_colour: 'not-a-color',
          secondary_colour: '#00FF00',
          accent_colour: '#0000FF',
        },
        authToken: user.accessToken,
      })

      const response = await updateBranding(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Invalid colour')
    })

    it('should reject invalid hex color (secondary)', async () => {
      const request = createTestRequest('/api/branding', {
        method: 'PUT',
        body: {
          primary_colour: '#FF0000',
          secondary_colour: '#GG0000',
          accent_colour: '#0000FF',
        },
        authToken: user.accessToken,
      })

      const response = await updateBranding(request)
      expect(response.status).toBe(400)
    })

    it('should reject invalid hex color (accent)', async () => {
      const request = createTestRequest('/api/branding', {
        method: 'PUT',
        body: {
          primary_colour: '#FF0000',
          secondary_colour: '#00FF00',
          accent_colour: '#0000',
        },
        authToken: user.accessToken,
      })

      const response = await updateBranding(request)
      expect(response.status).toBe(400)
    })

    it('should reject missing required colors', async () => {
      const request = createTestRequest('/api/branding', {
        method: 'PUT',
        body: {
          logo_url: 'data:image/png;base64,test',
          primary_colour: '#FF0000',
          // Missing secondary and accent
        },
        authToken: user.accessToken,
      })

      const response = await updateBranding(request)
      expect(response.status).toBe(400)
    })

    it('should accept valid 6-digit hex colors', async () => {
      const request = createTestRequest('/api/branding', {
        method: 'PUT',
        body: {
          primary_colour: '#abcdef',
          secondary_colour: '#ABCDEF',
          accent_colour: '#123456',
        },
        authToken: user.accessToken,
      })

      const response = await updateBranding(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Authentication & RLS', () => {
    it('should require authentication', async () => {
      const request = createTestRequest('/api/branding', {
        method: 'PUT',
        body: {
          primary_colour: '#FF0000',
          secondary_colour: '#00FF00',
          accent_colour: '#0000FF',
        },
        authToken: '', // No token
      })

      const response = await updateBranding(request)
      expect(response.status).toBe(401)
    })

    it('should reject branding update without active subscription', async () => {
      // Remove subscription
      await supabase
        .from('trainers')
        .update({ subscription_tier: null, subscription_status: null })
        .eq('id', user.user.id)

      const request = createTestRequest('/api/branding', {
        method: 'PUT',
        body: {
          primary_colour: '#FF0000',
          secondary_colour: '#00FF00',
          accent_colour: '#0000FF',
        },
        authToken: user.accessToken,
      })

      const response = await updateBranding(request)
      expect(response.status).toBe(403)

      const data = await response.json()
      expect(data.code).toBe('SUBSCRIPTION_REQUIRED')
    })

    it('should only update branding for authenticated user (RLS)', async () => {
      const user2 = await createTestUser()

      // Give user2 an active subscription
      await supabase
        .from('trainers')
        .update({ subscription_tier: 'starter', subscription_status: 'active' })
        .eq('id', user2.user.id)

      // Update user2's branding to have distinct colors (branding record already exists from createTestUser)
      await supabase
        .from('branding')
        .update({
          primary_colour: '#FFFFFF',
          secondary_colour: '#000000',
          accent_colour: '#CCCCCC',
        })
        .eq('trainer_id', user2.user.id)

      // User1 tries to update their branding
      const request = createTestRequest('/api/branding', {
        method: 'PUT',
        body: {
          primary_colour: '#FF0000',
          secondary_colour: '#00FF00',
          accent_colour: '#0000FF',
        },
        authToken: user.accessToken,
      })

      await updateBranding(request)

      // Verify user1's branding was updated
      const { data: branding1 } = await supabase
        .from('branding')
        .select('primary_colour')
        .eq('trainer_id', user.user.id)
        .single()

      expect(branding1?.primary_colour).toBe('#FF0000')

      // Verify user2's branding was NOT affected (should still be #FFFFFF)
      const { data: branding2 } = await supabase
        .from('branding')
        .select('primary_colour')
        .eq('trainer_id', user2.user.id)
        .single()

      expect(branding2?.primary_colour).toBe('#FFFFFF')

      await deleteTestUser(user2.user.id)
    })
  })

  describe('Updated Timestamp', () => {
    it('should update updated_at timestamp', async () => {
      // Get initial timestamp
      const { data: before } = await supabase
        .from('branding')
        .select('updated_at')
        .eq('trainer_id', user.user.id)
        .single()

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100))

      const request = createTestRequest('/api/branding', {
        method: 'PUT',
        body: {
          primary_colour: '#FF0000',
          secondary_colour: '#00FF00',
          accent_colour: '#0000FF',
        },
        authToken: user.accessToken,
      })

      await updateBranding(request)

      // Get new timestamp
      const { data: after } = await supabase
        .from('branding')
        .select('updated_at')
        .eq('trainer_id', user.user.id)
        .single()

      expect(new Date(after!.updated_at).getTime()).toBeGreaterThan(new Date(before!.updated_at).getTime())
    })
  })
})
