// @vitest-environment node
/**
 * Integration tests for client management API endpoints
 * Tests: POST /api/clients, GET /api/clients, GET /api/clients/:id, PUT /api/clients/:id
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createAuthenticatedUser, deleteUser } from '../../helpers/auth'
import { createServiceClient } from '../../helpers/db'

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

      const response = await fetch('http://localhost:3001/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${authToken}`,
        },
        body: JSON.stringify(clientData),
      })

      expect(response.status).toBe(201)

      const data = await response.json()
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

      const response = await fetch('http://localhost:3001/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${authToken}`,
        },
        body: JSON.stringify(invalidData),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
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

      const response = await fetch('http://localhost:3001/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${authToken}`,
        },
        body: JSON.stringify(dataWithScript),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      // Script tags should be stripped
      expect(data.name).not.toContain('<script>')
      expect(data.name).toBe('Jane  Doe') // Script removed
    })
  })

  describe('GET /api/clients - List Clients', () => {
    it('should return all clients for authenticated user', async () => {
      const response = await fetch('http://localhost:3001/api/clients', {
        headers: {
          'Cookie': `auth-token=${authToken}`,
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
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
      const response = await fetch('http://localhost:3001/api/clients?sortBy=name&sortOrder=asc', {
        headers: {
          'Cookie': `auth-token=${authToken}`,
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      // Verify sorted order
      for (let i = 1; i < data.length; i++) {
        expect(data[i].name >= data[i - 1].name).toBe(true)
      }
    })

    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3001/api/clients')
      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/clients/:id - Get Client Detail', () => {
    it('should return client details for authenticated user', async () => {
      const response = await fetch(`http://localhost:3001/api/clients/${clientId}`, {
        headers: {
          'Cookie': `auth-token=${authToken}`,
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()

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
      const response = await fetch(`http://localhost:3001/api/clients/${fakeId}`, {
        headers: {
          'Cookie': `auth-token=${authToken}`,
        },
      })

      expect(response.status).toBe(404)
    })

    it('should not allow access to other users clients (RLS)', async () => {
      // Create another user
      const otherUser = await createAuthenticatedUser()

      // Try to access first user's client with second user's token
      const response = await fetch(`http://localhost:3001/api/clients/${clientId}`, {
        headers: {
          'Cookie': `auth-token=${otherUser.accessToken}`,
        },
      })

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

      const response = await fetch(`http://localhost:3001/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${authToken}`,
        },
        body: JSON.stringify(updates),
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.name).toBe('John Smith')
      expect(data.email).toBe('john.smith@example.com')
      expect(data.phone).toBe('+44 7700 900001')
    })

    it('should validate updated data', async () => {
      const invalidUpdates = {
        age: 10, // Too young (min is 16)
      }

      const response = await fetch(`http://localhost:3001/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${authToken}`,
        },
        body: JSON.stringify(invalidUpdates),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.code).toBe('VALIDATION_ERROR')
    })

    it('should not allow updating other users clients', async () => {
      const otherUser = await createAuthenticatedUser()

      const updates = { name: 'Hacked Name' }
      const response = await fetch(`http://localhost:3001/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${otherUser.accessToken}`,
        },
        body: JSON.stringify(updates),
      })

      expect(response.status).toBe(404) // RLS should prevent access

      await deleteUser(otherUser.userId)
    })
  })

  describe('GET /api/clients/:id/plans - Get Client Plans', () => {
    it('should return empty array for client with no plans', async () => {
      const response = await fetch(`http://localhost:3001/api/clients/${clientId}/plans`, {
        headers: {
          'Cookie': `auth-token=${authToken}`,
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
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
      expect(data.trainer_id).toBe(userId)
    })

    it('should have last_plan_date as null for new client', async () => {
      const supabase = createServiceClient()
      const { data, error } = await supabase
        .from('clients')
        .select('last_plan_date')
        .eq('id', clientId)
        .single()

      expect(error).toBeNull()
      expect(data.last_plan_date).toBeNull()
    })
  })
})
