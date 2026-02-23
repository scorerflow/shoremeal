/**
 * Unit tests for client repository methods
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createAuthenticatedUser, deleteUser } from '../../helpers/auth'
import { createServiceClient } from '../../helpers/db'
import {
  createClient,
  getClientById,
  getClientsByTrainer,
  updateClient,
  getClientPlans,
  updateClientLastPlanDate,
} from '@/lib/repositories/clients'

describe('Client Repository', () => {
  let userId: string
  let supabase: ReturnType<typeof createServiceClient>
  let clientId: string

  beforeAll(async () => {
    const user = await createAuthenticatedUser()
    userId = user.userId
    supabase = createServiceClient()
  })

  afterAll(async () => {
    // Cleanup test client
    if (clientId) {
      await supabase.from('clients').delete().eq('id', clientId)
    }
    await deleteUser(userId)
  })

  describe('createClient', () => {
    it('should create a client with all fields', async () => {
      const clientData = {
        trainer_id: userId,
        name: 'Test Client',
        email: 'test@example.com',
        phone: '+44 7700 900000',
        form_data: {
          age: 30,
          gender: 'M',
          height: 180,
          weight: 80,
          ideal_weight: 75,
          activity_level: 'moderately_active',
          goal: 'fat_loss',
          dietary_type: 'omnivore',
          allergies: '',
          dislikes: '',
          preferences: '',
          budget: 70,
          cooking_skill: 'intermediate',
          prep_time: 30,
          meals_per_day: 3,
          plan_duration: 7,
          meal_prep_style: 'batch',
        },
      }

      const client = await createClient(supabase, clientData)

      expect(client).toBeDefined()
      expect(client.id).toBeDefined()
      expect(client.name).toBe('Test Client')
      expect(client.email).toBe('test@example.com')
      expect(client.phone).toBe('+44 7700 900000')
      expect(client.trainer_id).toBe(userId)

      clientId = client.id // Save for later tests
    })

    it('should create client without optional email/phone', async () => {
      const clientData = {
        trainer_id: userId,
        name: 'Minimal Client',
        form_data: {
          age: 25,
          gender: 'F',
          height: 165,
          weight: 60,
          ideal_weight: 58,
          activity_level: 'lightly_active',
          goal: 'fat_loss',
          dietary_type: 'vegan',
          allergies: '',
          dislikes: '',
          preferences: '',
          budget: 50,
          cooking_skill: 'beginner',
          prep_time: 20,
          meals_per_day: 3,
          plan_duration: 7,
          meal_prep_style: 'daily',
        },
      }

      const client = await createClient(supabase, clientData)

      expect(client.email).toBeNull()
      expect(client.phone).toBeNull()

      // Cleanup
      await supabase.from('clients').delete().eq('id', client.id)
    })
  })

  describe('getClientById', () => {
    it('should retrieve client by ID', async () => {
      const client = await getClientById(supabase, clientId)

      expect(client).toBeDefined()
      expect(client?.id).toBe(clientId)
      expect(client?.name).toBe('Test Client')
      expect(client?.email).toBe('test@example.com')
      expect(client?.phone).toBe('+44 7700 900000')
    })

    it('should return null for non-existent client', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const client = await getClientById(supabase, fakeId)

      expect(client).toBeNull()
    })
  })

  describe('getClientsByTrainer', () => {
    it('should retrieve all clients for trainer', async () => {
      const clients = await getClientsByTrainer(supabase, userId)

      expect(Array.isArray(clients)).toBe(true)
      expect(clients.length).toBeGreaterThan(0)

      const testClient = clients.find((c) => c.id === clientId)
      expect(testClient).toBeDefined()
      expect(testClient?.name).toBe('Test Client')
    })

    it('should sort clients by name', async () => {
      const clients = await getClientsByTrainer(supabase, userId, {
        sortBy: 'name',
        sortOrder: 'asc',
      })

      expect(clients.length).toBeGreaterThan(0)

      // Verify sorted order
      for (let i = 1; i < clients.length; i++) {
        expect(clients[i].name >= clients[i - 1].name).toBe(true)
      }
    })

    it('should sort clients by last_plan_date', async () => {
      const clients = await getClientsByTrainer(supabase, userId, {
        sortBy: 'last_plan_date',
        sortOrder: 'desc',
      })

      expect(Array.isArray(clients)).toBe(true)
    })

    it('should include phone and last_plan_date fields', async () => {
      const clients = await getClientsByTrainer(supabase, userId)

      const client = clients[0]
      expect(client).toHaveProperty('phone')
      expect(client).toHaveProperty('last_plan_date')
    })
  })

  describe('updateClient', () => {
    it('should update client profile fields', async () => {
      const updates = {
        name: 'Updated Name',
        email: 'updated@example.com',
        phone: '+44 7700 900001',
      }

      const updated = await updateClient(supabase, clientId, userId, updates)

      expect(updated.name).toBe('Updated Name')
      expect(updated.email).toBe('updated@example.com')
      expect(updated.phone).toBe('+44 7700 900001')
    })

    it('should update form_data fields', async () => {
      const updates = {
        form_data: {
          age: 31,
          gender: 'M',
          height: 180,
          weight: 78, // Updated
          ideal_weight: 73, // Updated
          activity_level: 'very_active', // Updated
          goal: 'muscle_gain', // Updated
          dietary_type: 'omnivore',
          allergies: '',
          dislikes: '',
          preferences: '',
          budget: 80, // Updated
          cooking_skill: 'advanced', // Updated
          prep_time: 45, // Updated
          meals_per_day: 4, // Updated
          plan_duration: 14, // Updated
          meal_prep_style: 'mixed', // Updated
        },
      }

      const updated = await updateClient(supabase, clientId, userId, updates)
      expect(updated).toBeDefined()

      // Verify updates persisted
      const client = await getClientById(supabase, clientId)
      expect(client?.form_data.weight).toBe(78)
      expect(client?.form_data.activity_level).toBe('very_active')
    })
  })

  describe('getClientPlans', () => {
    it('should return empty array for client with no plans', async () => {
      const plans = await getClientPlans(supabase, clientId, userId)

      expect(Array.isArray(plans)).toBe(true)
      expect(plans.length).toBe(0)
    })
  })

  describe('updateClientLastPlanDate', () => {
    it('should update last_plan_date field', async () => {
      const beforeUpdate = await getClientById(supabase, clientId)
      expect(beforeUpdate?.last_plan_date).toBeNull()

      await updateClientLastPlanDate(supabase, clientId)

      const afterUpdate = await getClientById(supabase, clientId)
      expect(afterUpdate?.last_plan_date).not.toBeNull()
      expect(new Date(afterUpdate!.last_plan_date!).getTime()).toBeGreaterThan(0)
    })

    it('should not throw on non-existent client', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'

      // Should not throw
      await expect(
        updateClientLastPlanDate(supabase, fakeId)
      ).resolves.not.toThrow()
    })
  })

  describe('RLS Enforcement', () => {
    it('should respect trainer_id when fetching clients', async () => {
      // Create another user
      const otherUser = await createAuthenticatedUser()

      // Try to get first user's clients with second user's ID
      const clients = await getClientsByTrainer(supabase, otherUser.userId)

      // Should not include first user's client
      const hasFirstUserClient = clients.some((c) => c.id === clientId)
      expect(hasFirstUserClient).toBe(false)

      // Cleanup
      await deleteUser(otherUser.userId)
    })
  })
})
