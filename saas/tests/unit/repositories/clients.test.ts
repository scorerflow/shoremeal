/**
 * Unit tests for clients repository (MOCKED - no real database calls)
 *
 * These tests verify repository logic in isolation by mocking the Supabase client.
 * Integration tests verify actual database behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createClient,
  getClientById,
  getClientsByTrainer,
  getActiveClientCount,
  updateClient,
  getClientPlans,
  updateClientLastPlanDate,
} from '@/lib/repositories/clients'
import type { SupabaseClient } from '@supabase/supabase-js'

describe('Clients Repository (Unit - Mocked)', () => {
  let mockSupabase: SupabaseClient

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
            order: vi.fn(),
          })),
          order: vi.fn(),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(),
        })),
      })),
    } as any
  })

  describe('createClient', () => {
    it('should create a client with all fields', async () => {
      const mockClient = {
        id: 'client-123',
        trainer_id: 'user-123',
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
        created_at: '2024-01-01T00:00:00Z',
        last_plan_date: null,
      }

      const singleMock = vi.fn().mockResolvedValue({ data: mockClient, error: null })
      const selectMock = vi.fn(() => ({ single: singleMock }))
      const insertMock = vi.fn(() => ({ select: selectMock }))
      mockSupabase.from = vi.fn(() => ({ insert: insertMock })) as any

      const clientData = {
        trainer_id: 'user-123',
        name: 'Test Client',
        email: 'test@example.com',
        phone: '+44 7700 900000',
        form_data: mockClient.form_data,
      }

      const result = await createClient(mockSupabase, clientData)

      expect(insertMock).toHaveBeenCalledWith(clientData)
      expect(result).toEqual(mockClient)
    })

    it('should create client without optional email/phone', async () => {
      const mockClient = {
        id: 'client-456',
        trainer_id: 'user-123',
        name: 'Minimal Client',
        email: null,
        phone: null,
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
        created_at: '2024-01-01T00:00:00Z',
        last_plan_date: null,
      }

      const singleMock = vi.fn().mockResolvedValue({ data: mockClient, error: null })
      mockSupabase.from = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({ single: singleMock })),
        })),
      })) as any

      const result = await createClient(mockSupabase, {
        trainer_id: 'user-123',
        name: 'Minimal Client',
        form_data: mockClient.form_data,
      })

      expect(result.email).toBeNull()
      expect(result.phone).toBeNull()
    })

    it('should throw error when insert fails', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })
      mockSupabase.from = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({ single: singleMock })),
        })),
      })) as any

      await expect(
        createClient(mockSupabase, {
          trainer_id: 'user-123',
          name: 'Test',
          form_data: {} as any,
        })
      ).rejects.toThrow('Failed to create client: Database error')
    })
  })

  describe('getClientById', () => {
    it('should retrieve client by ID', async () => {
      const mockClient = {
        id: 'client-123',
        trainer_id: 'user-123',
        name: 'Test Client',
        email: 'test@example.com',
        phone: '+44 7700 900000',
        form_data: {},
        created_at: '2024-01-01T00:00:00Z',
        last_plan_date: null,
      }

      const singleMock = vi.fn().mockResolvedValue({ data: mockClient, error: null })
      const eqMock = vi.fn(() => ({ single: singleMock }))
      const selectMock = vi.fn(() => ({ eq: eqMock }))
      mockSupabase.from = vi.fn(() => ({ select: selectMock })) as any

      const result = await getClientById(mockSupabase, 'client-123')

      expect(selectMock).toHaveBeenCalledWith('*')
      expect(eqMock).toHaveBeenCalledWith('id', 'client-123')
      expect(result).toEqual(mockClient)
    })

    it('should return null for non-existent client', async () => {
      const singleMock = vi.fn().mockResolvedValue({ data: null, error: null })
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: singleMock })),
        })),
      })) as any

      const result = await getClientById(mockSupabase, 'fake-id')

      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      })
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single: singleMock })),
        })),
      })) as any

      const result = await getClientById(mockSupabase, 'fake-id')

      expect(result).toBeNull()
    })
  })

  describe('getClientsByTrainer', () => {
    function createClientsMock(data: any[], error: any = null) {
      const rangeMock = vi.fn().mockResolvedValue({ data, error })
      const orderMock = vi.fn(() => ({ range: rangeMock }))
      const eqMock = vi.fn(() => ({ order: orderMock }))
      const selectMock = vi.fn(() => ({ eq: eqMock }))
      mockSupabase.from = vi.fn(() => ({ select: selectMock })) as any
      return { selectMock, eqMock, orderMock, rangeMock }
    }

    it('should retrieve clients for trainer with hasMore=false', async () => {
      const mockClients = [
        {
          id: 'client-1',
          name: 'Client A',
          email: 'a@example.com',
          phone: null,
          last_plan_date: null,
          created_at: '2024-01-01T00:00:00Z',
          plans: [],
        },
        {
          id: 'client-2',
          name: 'Client B',
          email: 'b@example.com',
          phone: '+44 123',
          last_plan_date: '2024-01-05T00:00:00Z',
          created_at: '2024-01-02T00:00:00Z',
          plans: [{ id: 'plan-1', status: 'completed', created_at: '2024-01-05T00:00:00Z' }],
        },
      ]

      const { selectMock, eqMock, orderMock, rangeMock } = createClientsMock(mockClients)

      const result = await getClientsByTrainer(mockSupabase, 'user-123')

      expect(selectMock).toHaveBeenCalledWith(
        'id, name, email, phone, last_plan_date, created_at, plans(id, status, created_at)'
      )
      expect(eqMock).toHaveBeenCalledWith('trainer_id', 'user-123')
      expect(orderMock).toHaveBeenCalledWith('last_plan_date', { ascending: false, nullsFirst: false })
      expect(rangeMock).toHaveBeenCalledWith(0, 100) // default limit=100
      expect(result).toEqual({ clients: mockClients, hasMore: false })
    })

    it('should return hasMore=true when results exceed limit', async () => {
      // 3 results with limit=2 → hasMore=true, trimmed to 2
      const mockClients = [
        { id: '1', name: 'Alice', plans: [] },
        { id: '2', name: 'Bob', plans: [] },
        { id: '3', name: 'Charlie', plans: [] },
      ]

      createClientsMock(mockClients)

      const result = await getClientsByTrainer(mockSupabase, 'user-123', { limit: 2 })

      expect(result.hasMore).toBe(true)
      expect(result.clients).toHaveLength(2)
      expect(result.clients[0].name).toBe('Alice')
      expect(result.clients[1].name).toBe('Bob')
    })

    it('should sort clients by name ascending', async () => {
      const { orderMock } = createClientsMock([])

      await getClientsByTrainer(mockSupabase, 'user-123', {
        sortBy: 'name',
        sortOrder: 'asc',
      })

      expect(orderMock).toHaveBeenCalledWith('name', { ascending: true, nullsFirst: false })
    })

    it('should sort clients by last_plan_date descending', async () => {
      const { orderMock } = createClientsMock([])

      await getClientsByTrainer(mockSupabase, 'user-123', {
        sortBy: 'last_plan_date',
        sortOrder: 'desc',
      })

      expect(orderMock).toHaveBeenCalledWith('last_plan_date', { ascending: false, nullsFirst: false })
    })

    it('should throw error on database error', async () => {
      createClientsMock(null, { message: 'DB error' })

      await expect(
        getClientsByTrainer(mockSupabase, 'user-123')
      ).rejects.toThrow('Failed to fetch clients: DB error')
    })
  })

  describe('updateClient', () => {
    it('should update client profile fields', async () => {
      const mockUpdated = {
        id: 'client-123',
        trainer_id: 'user-123',
        name: 'Updated Name',
        email: 'updated@example.com',
        phone: '+44 999',
        form_data: {},
        created_at: '2024-01-01T00:00:00Z',
        last_plan_date: null,
      }

      const singleMock = vi.fn().mockResolvedValue({ data: mockUpdated, error: null })
      const eqMock = vi.fn(() => ({
        select: vi.fn(() => ({ single: singleMock })),
      }))
      const eq2Mock = vi.fn(() => ({ eq: eqMock }))
      const updateMock = vi.fn(() => ({ eq: eq2Mock }))
      mockSupabase.from = vi.fn(() => ({ update: updateMock })) as any

      const result = await updateClient(mockSupabase, 'client-123', 'user-123', {
        name: 'Updated Name',
        email: 'updated@example.com',
        phone: '+44 999',
      })

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Name',
          email: 'updated@example.com',
          phone: '+44 999',
        })
      )
      expect(eq2Mock).toHaveBeenCalledWith('id', 'client-123')
      expect(eqMock).toHaveBeenCalledWith('trainer_id', 'user-123')
      expect(result).toEqual(mockUpdated)
    })

    it('should update form_data fields', async () => {
      const updatedFormData = {
        age: 31,
        weight: 78,
        activity_level: 'very_active',
      }

      const mockUpdated = {
        id: 'client-123',
        form_data: updatedFormData,
      }

      const singleMock = vi.fn().mockResolvedValue({ data: mockUpdated, error: null })
      mockSupabase.from = vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({ single: singleMock })),
            })),
          })),
        })),
      })) as any

      const result = await updateClient(mockSupabase, 'client-123', 'user-123', {
        form_data: updatedFormData as any,
      })

      expect(result.form_data).toEqual(updatedFormData)
    })

    it('should throw error when update fails', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      })
      mockSupabase.from = vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({ single: singleMock })),
            })),
          })),
        })),
      })) as any

      await expect(
        updateClient(mockSupabase, 'client-123', 'user-123', { name: 'Test' })
      ).rejects.toThrow('Failed to update client: Update failed')
    })
  })

  describe('getClientPlans', () => {
    it('should return empty array for client with no plans', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: [], error: null })
      const eq2Mock = vi.fn(() => ({ order: orderMock }))
      const eq1Mock = vi.fn(() => ({ eq: eq2Mock }))
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: eq1Mock,
        })),
      })) as any

      const result = await getClientPlans(mockSupabase, 'client-123', 'user-123')

      expect(eq1Mock).toHaveBeenCalledWith('client_id', 'client-123')
      expect(eq2Mock).toHaveBeenCalledWith('trainer_id', 'user-123')
      expect(result).toEqual([])
    })

    it('should return plans for client', async () => {
      const mockPlans = [
        {
          id: 'plan-1',
          status: 'completed',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T01:00:00Z',
        },
        {
          id: 'plan-2',
          status: 'pending',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T01:00:00Z',
        },
      ]

      const orderMock = vi.fn().mockResolvedValue({ data: mockPlans, error: null })
      const eq2Mock = vi.fn(() => ({ order: orderMock }))
      const eq1Mock = vi.fn(() => ({ eq: eq2Mock }))
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: eq1Mock,
        })),
      })) as any

      const result = await getClientPlans(mockSupabase, 'client-123', 'user-123')

      expect(result).toEqual(mockPlans)
      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('should throw error on database error', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      })
      const eq2Mock = vi.fn(() => ({ order: orderMock }))
      const eq1Mock = vi.fn(() => ({ eq: eq2Mock }))
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: eq1Mock,
        })),
      })) as any

      await expect(
        getClientPlans(mockSupabase, 'client-123', 'user-123')
      ).rejects.toThrow('Failed to fetch client plans: DB error')
    })
  })

  describe('getActiveClientCount', () => {
    it('should count clients with last_plan_date within 30 days', async () => {
      const gteMock = vi.fn().mockResolvedValue({ count: 5, error: null })
      const eqMock = vi.fn(() => ({ gte: gteMock }))
      const selectMock = vi.fn(() => ({ eq: eqMock }))
      mockSupabase.from = vi.fn(() => ({ select: selectMock })) as any

      const result = await getActiveClientCount(mockSupabase, 'user-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('clients')
      expect(selectMock).toHaveBeenCalledWith('*', { count: 'exact', head: true })
      expect(eqMock).toHaveBeenCalledWith('trainer_id', 'user-123')
      expect(gteMock).toHaveBeenCalledWith('last_plan_date', expect.any(String))
      expect(result).toBe(5)
    })

    it('should return 0 when no active clients', async () => {
      const gteMock = vi.fn().mockResolvedValue({ count: 0, error: null })
      const eqMock = vi.fn(() => ({ gte: gteMock }))
      const selectMock = vi.fn(() => ({ eq: eqMock }))
      mockSupabase.from = vi.fn(() => ({ select: selectMock })) as any

      const result = await getActiveClientCount(mockSupabase, 'user-123')

      expect(result).toBe(0)
    })

    it('should return 0 when count is null', async () => {
      const gteMock = vi.fn().mockResolvedValue({ count: null, error: null })
      const eqMock = vi.fn(() => ({ gte: gteMock }))
      const selectMock = vi.fn(() => ({ eq: eqMock }))
      mockSupabase.from = vi.fn(() => ({ select: selectMock })) as any

      const result = await getActiveClientCount(mockSupabase, 'user-123')

      expect(result).toBe(0)
    })

    it('should throw error on database error', async () => {
      const gteMock = vi.fn().mockResolvedValue({ count: null, error: { message: 'DB error' } })
      const eqMock = vi.fn(() => ({ gte: gteMock }))
      const selectMock = vi.fn(() => ({ eq: eqMock }))
      mockSupabase.from = vi.fn(() => ({ select: selectMock })) as any

      await expect(
        getActiveClientCount(mockSupabase, 'user-123')
      ).rejects.toThrow('Failed to count active clients: DB error')
    })

    it('should use a date approximately 30 days ago for the gte filter', async () => {
      const gteMock = vi.fn().mockResolvedValue({ count: 3, error: null })
      const eqMock = vi.fn(() => ({ gte: gteMock }))
      const selectMock = vi.fn(() => ({ eq: eqMock }))
      mockSupabase.from = vi.fn(() => ({ select: selectMock })) as any

      await getActiveClientCount(mockSupabase, 'user-123')

      const dateArg = gteMock.mock.calls[0][1]
      const passedDate = new Date(dateArg)
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() - 30)

      // Should be within 5 seconds of expected (accounting for test execution time)
      expect(Math.abs(passedDate.getTime() - expectedDate.getTime())).toBeLessThan(5000)
    })
  })

  describe('updateClientLastPlanDate', () => {
    it('should update last_plan_date field', async () => {
      const eqMock = vi.fn().mockResolvedValue({ error: null })
      const updateMock = vi.fn(() => ({ eq: eqMock }))
      mockSupabase.from = vi.fn(() => ({ update: updateMock })) as any

      await updateClientLastPlanDate(mockSupabase, 'client-123')

      expect(updateMock).toHaveBeenCalledWith({
        last_plan_date: expect.any(String),
        updated_at: expect.any(String),
      })
      expect(eqMock).toHaveBeenCalledWith('id', 'client-123')
    })

    it('should not throw on error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const eqMock = vi.fn().mockResolvedValue({ error: { message: 'Not found' } })
      mockSupabase.from = vi.fn(() => ({
        update: vi.fn(() => ({ eq: eqMock })),
      })) as any

      // Should not throw (just logs error)
      await expect(
        updateClientLastPlanDate(mockSupabase, 'fake-id')
      ).resolves.not.toThrow()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to update client last_plan_date:',
        { message: 'Not found' }
      )

      consoleErrorSpy.mockRestore()
    })
  })
})
