/**
 * RLS Data Isolation Tests
 * Verifies Row Level Security policies prevent data leakage
 * CRITICAL: Multi-tenancy depends on these policies working correctly
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { createTestUser, deleteTestUser } from '../../helpers/auth'
import { createTestServiceClient, waitForDb } from '../../helpers/db'
import type { TestUser } from '../../helpers/auth'

describe('RLS Data Isolation', () => {
  let userA: TestUser
  let userB: TestUser
  let clientA: any
  let clientB: any

  beforeEach(async () => {
    // Create two test users
    userA = await createTestUser()
    userB = await createTestUser()

    // Wait for database triggers
    await waitForDb(1000)

    // Create user-scoped Supabase clients (RLS active)
    clientA = createClient(
      process.env.TEST_SUPABASE_URL!,
      process.env.TEST_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${userA.accessToken}`,
          },
        },
      }
    )

    clientB = createClient(
      process.env.TEST_SUPABASE_URL!,
      process.env.TEST_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${userB.accessToken}`,
          },
        },
      }
    )
  })

  afterEach(async () => {
    await deleteTestUser(userA.user.id)
    await deleteTestUser(userB.user.id)
  })

  describe('Trainers Table', () => {
    it('should allow users to read their own profile', async () => {
      const { data, error } = await clientA
        .from('trainers')
        .select('*')
        .eq('id', userA.user.id)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.email).toBe(userA.email)
    })

    it('should prevent users from reading other profiles', async () => {
      const { data, error } = await clientA
        .from('trainers')
        .select('*')
        .eq('id', userB.user.id)
        .single()

      // RLS should block this - either error or null data
      expect(data).toBeNull()
    })
  })

  describe('Clients Table', () => {
    it('should allow users to create their own clients', async () => {
      const { data, error } = await clientA
        .from('clients')
        .insert({
          trainer_id: userA.user.id,
          name: 'Test Client A',
          email: 'clienta@test.test',
          form_data: { age: 30 },
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.trainer_id).toBe(userA.user.id)
    })

    it('should prevent users from seeing other users\' clients', async () => {
      const supabase = createTestServiceClient()

      // User A creates a client (using service role to bypass RLS for setup)
      const { data: clientData } = await supabase
        .from('clients')
        .insert({
          trainer_id: userA.user.id,
          name: 'User A Client',
          email: 'clienta@test.test',
          form_data: {},
        })
        .select()
        .single()

      await waitForDb(500)

      // User B tries to query User A's client
      const { data: clientsForB } = await clientB
        .from('clients')
        .select('*')

      // User B should see zero clients (RLS blocks User A's data)
      expect(clientsForB).toEqual([])
    })

    it('should prevent users from creating clients for other trainers', async () => {
      const { data, error } = await clientA
        .from('clients')
        .insert({
          trainer_id: userB.user.id, // Trying to create client for User B
          name: 'Malicious Client',
          email: 'malicious@test.test',
          form_data: {},
        })
        .select()
        .single()

      // RLS should block this
      expect(error).toBeDefined()
      expect(data).toBeNull()
    })
  })

  describe('Plans Table', () => {
    it('should prevent users from seeing other users\' plans', async () => {
      const supabase = createTestServiceClient()

      // Setup: User A creates client and plan
      const { data: clientData } = await supabase
        .from('clients')
        .insert({
          trainer_id: userA.user.id,
          name: 'User A Client',
          email: 'clienta@test.test',
          form_data: {},
        })
        .select()
        .single()

      const { data: planData } = await supabase
        .from('plans')
        .insert({
          trainer_id: userA.user.id,
          client_id: clientData!.id,
          status: 'pending',
        })
        .select()
        .single()

      await waitForDb(500)

      // User B tries to query User A's plans
      const { data: plansForB } = await clientB
        .from('plans')
        .select('*')

      // User B should see zero plans
      expect(plansForB).toEqual([])
    })
  })

  describe('Branding Table', () => {
    it('should prevent users from reading other users\' branding', async () => {
      // User A's branding was auto-created on signup
      await waitForDb(500)

      // User B tries to read User A's branding
      const { data: brandingForB } = await clientB
        .from('branding')
        .select('*')
        .eq('trainer_id', userA.user.id)

      // RLS should block this
      expect(brandingForB).toEqual([])
    })
  })
})
