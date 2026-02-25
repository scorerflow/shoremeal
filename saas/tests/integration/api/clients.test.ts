// @vitest-environment node
/**
 * Integration tests for client management API endpoints
 * Tests route handlers directly without HTTP server
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createAuthenticatedUser, deleteUser } from '../../helpers/auth'
import { createServiceClient } from '../../helpers/db'
import { createTestRequest, getResponseJson } from '../../helpers/request'

// Import route handlers
import { GET as getClients, POST as createClient } from '@/app/api/clients/route'
import { GET as getClient, PUT as updateClient } from '@/app/api/clients/[id]/route'
import { GET as getClientPlans } from '@/app/api/clients/[id]/plans/route'

describe('Client Management API', () => {
  let userId: string
  let userEmail: string
  let authToken: string
  let clientId: string

  beforeAll(async () => {
    const user = await createAuthenticatedUser()
    userId = user.userId
    userEmail = user.email
    authToken = user.accessToken
  })

  afterAll(async () => {
    await deleteUser(userId)
  })

  describe('POST /api/clients - Create Client', () => {
    it('should create a new client with valid data', async () => {
      const clientData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+44 7700 900000',
        age: 30,
        gender: 'M',
        height: 180,
        weight: 80,
        ideal_weight: 75,
        activity_level: 'moderately_active',
        goal: 'fat_loss',
        dietary_type: 'omnivore',
        allergies: 'Peanuts',
        dislikes: 'Mushrooms',
        preferences: 'Italian',
        budget: 70,
        cooking_skill: 'intermediate',
        prep_time: 30,
        meals_per_day: 3,
        plan_duration: 7,
        meal_prep_style: 'batch',
      }

      const request = createTestRequest('/api/clients', {
        method: 'POST',
        body: clientData,
        authToken,
      })

      const response = await createClient(request)
      expect(response.status).toBe(201)

      const data = await getResponseJson(response)
      expect(data).toHaveProperty('id')
      expect(data.name).toBe('John Doe')
      expect(data.email).toBe('john@example.com')
      expect(data.phone).toBe('+44 7700 900000')

      clientId = data.id // Save for later tests
    })

    it('should reject client creation without required fields', async () => {
      const invalidData = {
        email: 'test@example.com',
        // Missing name
      }

      const request = createTestRequest('/api/clients', {
        method: 'POST',
        body: invalidData,
        authToken,
      })

      const response = await createClient(request)
      expect(response.status).toBe(400)

      const data = await getResponseJson(response)
      expect(data.code).toBe('VALIDATION_ERROR')
    })

    it('should sanitize input text', async () => {
      const dataWithScript = {
        name: 'Jane <script>alert("xss")</script> Doe',
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
      }

      const request = createTestRequest('/api/clients', {
        method: 'POST',
        body: dataWithScript,
        authToken,
      })

      const response = await createClient(request)
      expect(response.status).toBe(201)

      const data = await getResponseJson(response)
      // Script tags should be stripped
      expect(data.name).not.toContain('<script>')
      expect(data.name).toBe('Jane  Doe') // Script removed
    })
  })

  describe('GET /api/clients - List Clients', () => {
    it('should return all clients for authenticated user', async () => {
      const request = createTestRequest('/api/clients', {
        authToken,
      })

      const response = await getClients(request)
      expect(response.status).toBe(200)

      const data = await getResponseJson(response)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)

      // Check client structure
      const client = data[0]
      expect(client).toHaveProperty('id')
      expect(client).toHaveProperty('name')
      expect(client).toHaveProperty('email')
      expect(client).toHaveProperty('phone')
      expect(client).toHaveProperty('last_plan_date')
      expect(client).toHaveProperty('created_at')
      expect(client).toHaveProperty('plans')
    })

    it('should support sorting by name', async () => {
      const request = createTestRequest('/api/clients', {
        authToken,
        searchParams: {
          sortBy: 'name',
          sortOrder: 'asc',
        },
      })

      const response = await getClients(request)
      expect(response.status).toBe(200)

      const data = await getResponseJson(response)

      // Verify sorted order
      for (let i = 1; i < data.length; i++) {
        expect(data[i].name >= data[i - 1].name).toBe(true)
      }
    })

    it('should require authentication', async () => {
      const request = createTestRequest('/api/clients')

      const response = await getClients(request)
      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/clients/:id - Get Client Detail', () => {
    it('should return client details for authenticated user', async () => {
      const request = createTestRequest(`/api/clients/${clientId}`, {
        authToken,
      })

      const response = await getClient(request, { params: { id: clientId } })
      expect(response.status).toBe(200)

      const data = await getResponseJson(response)

      expect(data.id).toBe(clientId)
      expect(data.name).toBe('John Doe')
      expect(data.email).toBe('john@example.com')
      expect(data.phone).toBe('+44 7700 900000')
      expect(data).toHaveProperty('age')
      expect(data).toHaveProperty('gender')
      expect(data).toHaveProperty('height')
      expect(data).toHaveProperty('weight')
      expect(data).toHaveProperty('last_plan_date')
    })

    it('should return 404 for non-existent client', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const request = createTestRequest(`/api/clients/${fakeId}`, {
        authToken,
      })

      const response = await getClient(request, { params: { id: fakeId } })
      expect(response.status).toBe(404)
    })

    it('should not allow access to other users clients (RLS)', async () => {
      // Create another user
      const otherUser = await createAuthenticatedUser()

      // Try to access first user's client with second user's token
      const request = createTestRequest(`/api/clients/${clientId}`, {
        authToken: otherUser.accessToken,
      })

      const response = await getClient(request, { params: { id: clientId } })
      expect(response.status).toBe(404) // RLS should prevent access

      // Cleanup
      await deleteUser(otherUser.userId)
    })
  })

  describe('PUT /api/clients/:id - Update Client', () => {
    it('should update client information', async () => {
      const updates = {
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '+44 7700 900001',
        weight: 78, // Updated weight
        ideal_weight: 73, // Updated goal weight
      }

      const request = createTestRequest(`/api/clients/${clientId}`, {
        method: 'PUT',
        body: updates,
        authToken,
      })

      const response = await updateClient(request, { params: { id: clientId } })
      expect(response.status).toBe(200)

      const data = await getResponseJson(response)

      expect(data.name).toBe('John Smith')
      expect(data.email).toBe('john.smith@example.com')
      expect(data.phone).toBe('+44 7700 900001')
    })

    it('should validate updated data', async () => {
      const invalidUpdates = {
        age: 10, // Too young (min is 16)
      }

      const request = createTestRequest(`/api/clients/${clientId}`, {
        method: 'PUT',
        body: invalidUpdates,
        authToken,
      })

      const response = await updateClient(request, { params: { id: clientId } })
      expect(response.status).toBe(400)

      const data = await getResponseJson(response)
      expect(data.code).toBe('VALIDATION_ERROR')
    })

    it('should not allow updating other users clients', async () => {
      const otherUser = await createAuthenticatedUser()

      const updates = { name: 'Hacked Name' }
      const request = createTestRequest(`/api/clients/${clientId}`, {
        method: 'PUT',
        body: updates,
        authToken: otherUser.accessToken,
      })

      const response = await updateClient(request, { params: { id: clientId } })
      expect(response.status).toBe(404) // RLS should prevent access

      await deleteUser(otherUser.userId)
    })
  })

  describe('GET /api/clients/:id/plans - Get Client Plans', () => {
    it('should return empty array for client with no plans', async () => {
      const request = createTestRequest(`/api/clients/${clientId}/plans`, {
        authToken,
      })

      const response = await getClientPlans(request, { params: { id: clientId } })
      expect(response.status).toBe(200)

      const data = await getResponseJson(response)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(0) // No plans yet
    })
  })

  describe('Database Integrity', () => {
    it('should have created client with correct trainer_id', async () => {
      const supabase = createServiceClient()
      const { data, error } = await supabase
        .from('clients')
        .select('trainer_id')
        .eq('id', clientId)
        .single()

      expect(error).toBeNull()
      expect(data!.trainer_id).toBe(userId)
    })

    it('should have last_plan_date as null for new client', async () => {
      const supabase = createServiceClient()
      const { data, error } = await supabase
        .from('clients')
        .select('last_plan_date')
        .eq('id', clientId)
        .single()

      expect(error).toBeNull()
      expect(data!.last_plan_date).toBeNull()
    })
  })
})
