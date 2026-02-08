import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requestPlanGeneration, getPlanStatusData, generatePlanPdfForExport } from '../plans'
import { AppError } from '@/lib/errors'
import type { ValidatedPlanInput } from '@/lib/validation'

// Mock dependencies
vi.mock('@/lib/repositories/trainers', () => ({
  getTrainerById: vi.fn(),
}))

vi.mock('@/lib/repositories/clients', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/repositories/plans', () => ({
  createPlan: vi.fn(),
  getPlanWithClient: vi.fn(),
}))

vi.mock('@/lib/repositories/branding', () => ({
  getBrandingColours: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))

vi.mock('@/lib/inngest/client', () => ({
  inngest: {
    send: vi.fn(),
  },
}))

vi.mock('@/lib/audit', () => ({
  writeAuditLog: vi.fn(),
}))

vi.mock('@/lib/pdf/generate', () => ({
  generatePlanPdf: vi.fn(),
}))

import { getTrainerById } from '@/lib/repositories/trainers'
import { createClient as createClientRecord } from '@/lib/repositories/clients'
import { createPlan, getPlanWithClient } from '@/lib/repositories/plans'
import { getBrandingColours } from '@/lib/repositories/branding'
import { createServiceClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'
import { writeAuditLog } from '@/lib/audit'
import { generatePlanPdf } from '@/lib/pdf/generate'

describe('requestPlanGeneration', () => {
  const mockSupabase = {} as any
  const userId = 'trainer-123'
  const ip = '127.0.0.1'

  const validFormData: ValidatedPlanInput = {
    name: 'John Doe',
    age: 25,
    gender: 'M',
    height: '180cm',
    weight: '75kg',
    ideal_weight: '70kg',
    activity_level: 'moderately_active',
    goal: 'fat_loss',
    dietary_type: 'omnivore',
    allergies: '',
    dislikes: '',
    preferences: '',
    budget: '$50/week',
    cooking_skill: 'intermediate',
    prep_time: '30min',
    meals_per_day: '3',
    plan_duration: '7',
    meal_prep_style: 'mixed',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw error if trainer has no active subscription', async () => {
    vi.mocked(getTrainerById).mockResolvedValue({
      id: userId,
      email: 'trainer@test.com',
      full_name: 'Test Trainer',
      business_name: null,
      stripe_customer_id: null,
      subscription_tier: null,
      subscription_status: null,
      plans_used_this_month: 0,
      billing_cycle_start: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    await expect(
      requestPlanGeneration(mockSupabase, userId, validFormData, ip)
    ).rejects.toThrow(AppError)

    await expect(
      requestPlanGeneration(mockSupabase, userId, validFormData, ip)
    ).rejects.toThrow('Active subscription required')
  })

  it('should throw error if trainer subscription is not active', async () => {
    vi.mocked(getTrainerById).mockResolvedValue({
      id: userId,
      email: 'trainer@test.com',
      full_name: 'Test Trainer',
      business_name: null,
      stripe_customer_id: 'cus_123',
      subscription_tier: 'starter',
      subscription_status: 'cancelled',
      plans_used_this_month: 0,
      billing_cycle_start: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    await expect(
      requestPlanGeneration(mockSupabase, userId, validFormData, ip)
    ).rejects.toThrow('Active subscription required')
  })

  it('should throw error if monthly plan limit reached', async () => {
    vi.mocked(getTrainerById).mockResolvedValue({
      id: userId,
      email: 'trainer@test.com',
      full_name: 'Test Trainer',
      business_name: null,
      stripe_customer_id: 'cus_123',
      subscription_tier: 'starter',
      subscription_status: 'active',
      plans_used_this_month: 10, // Starter tier limit is 10
      billing_cycle_start: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    await expect(
      requestPlanGeneration(mockSupabase, userId, validFormData, ip)
    ).rejects.toThrow(AppError)

    await expect(
      requestPlanGeneration(mockSupabase, userId, validFormData, ip)
    ).rejects.toThrow('Monthly plan limit reached')
  })

  it('should successfully create plan and send Inngest event on happy path', async () => {
    const mockTrainer = {
      id: userId,
      email: 'trainer@test.com',
      full_name: 'Test Trainer',
      business_name: 'Test Business',
      stripe_customer_id: 'cus_123',
      subscription_tier: 'pro',
      subscription_status: 'active',
      plans_used_this_month: 5, // Under Pro limit of 30
      billing_cycle_start: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const mockClient = {
      id: 'client-456',
      trainer_id: userId,
      name: 'John Doe',
      email: null,
      form_data: validFormData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const mockPlan = {
      id: 'plan-789',
      client_id: mockClient.id,
      trainer_id: userId,
      pdf_url: null,
      plan_text: null,
      generation_cost: 0,
      tokens_used: 0,
      status: 'pending' as const,
      error_message: null,
      attempts: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const mockServiceDb = {} as any

    vi.mocked(getTrainerById).mockResolvedValue(mockTrainer as any)
    vi.mocked(createClientRecord).mockResolvedValue(mockClient as any)
    vi.mocked(createServiceClient).mockResolvedValue(mockServiceDb)
    vi.mocked(createPlan).mockResolvedValue(mockPlan)
    vi.mocked(inngest.send).mockResolvedValue({ ids: ['event-123'] } as any)

    const result = await requestPlanGeneration(mockSupabase, userId, validFormData, ip)

    expect(result).toEqual({
      plan_id: mockPlan.id,
      client_id: mockClient.id,
      status: 'pending',
    })

    expect(createClientRecord).toHaveBeenCalledWith(mockSupabase, {
      trainer_id: userId,
      name: validFormData.name,
      form_data: validFormData,
    })

    expect(createPlan).toHaveBeenCalledWith(mockServiceDb, {
      client_id: mockClient.id,
      trainer_id: userId,
      status: 'pending',
    })

    expect(inngest.send).toHaveBeenCalledWith({
      name: 'plan/generate.requested',
      data: {
        planId: mockPlan.id,
        clientId: mockClient.id,
        trainerId: userId,
        formData: validFormData,
        businessName: 'Test Business',
      },
    })

    expect(writeAuditLog).toHaveBeenCalledWith({
      userId,
      action: 'plan.generation_started',
      resourceType: 'plan',
      resourceId: mockPlan.id,
      metadata: { clientId: mockClient.id, tier: 'pro' },
      ipAddress: ip,
    })
  })

  it('should handle trainer without business name', async () => {
    const mockTrainer = {
      id: userId,
      email: 'trainer@test.com',
      full_name: 'Test Trainer',
      business_name: null,
      stripe_customer_id: 'cus_123',
      subscription_tier: 'starter',
      subscription_status: 'active',
      plans_used_this_month: 2,
      billing_cycle_start: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    vi.mocked(getTrainerById).mockResolvedValue(mockTrainer as any)
    vi.mocked(createClientRecord).mockResolvedValue({ id: 'client-456' } as any)
    vi.mocked(createServiceClient).mockResolvedValue({} as any)
    vi.mocked(createPlan).mockResolvedValue({ id: 'plan-789' } as any)
    vi.mocked(inngest.send).mockResolvedValue({ ids: ['event-123'] } as any)

    await requestPlanGeneration(mockSupabase, userId, validFormData, ip)

    const inngestCall = vi.mocked(inngest.send).mock.calls[0][0] as any
    expect(inngestCall.data.businessName).toBeUndefined()
  })
})

describe('getPlanStatusData', () => {
  const mockSupabase = {} as any
  const planId = 'plan-123'
  const userId = 'trainer-456'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw error if plan not found', async () => {
    vi.mocked(getPlanWithClient).mockResolvedValue(null)

    await expect(
      getPlanStatusData(mockSupabase, planId, userId)
    ).rejects.toThrow(AppError)

    await expect(
      getPlanStatusData(mockSupabase, planId, userId)
    ).rejects.toThrow('Plan not found')
  })

  it('should return plan status data without plan_text for pending plan', async () => {
    const mockPlan = {
      id: planId,
      status: 'pending' as const,
      plan_text: null,
      trainer_id: userId,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      clients: { name: 'John Doe' },
    }

    vi.mocked(getPlanWithClient).mockResolvedValue(mockPlan)

    const result = await getPlanStatusData(mockSupabase, planId, userId)

    expect(result).toEqual({
      id: planId,
      status: 'pending',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      client_name: 'John Doe',
    })

    expect(result).not.toHaveProperty('plan_text')
  })

  it('should return plan status data with plan_text for completed plan', async () => {
    const mockPlan = {
      id: planId,
      status: 'completed' as const,
      plan_text: 'Full nutrition plan content here...',
      trainer_id: userId,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:10:00Z',
      clients: { name: 'Jane Smith' },
    }

    vi.mocked(getPlanWithClient).mockResolvedValue(mockPlan)

    const result = await getPlanStatusData(mockSupabase, planId, userId)

    expect(result).toEqual({
      id: planId,
      status: 'completed',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:10:00Z',
      client_name: 'Jane Smith',
      plan_text: 'Full nutrition plan content here...',
    })
  })

  it('should handle plan with no client data', async () => {
    const mockPlan = {
      id: planId,
      status: 'generating' as const,
      plan_text: null,
      trainer_id: userId,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:05:00Z',
      clients: null,
    }

    vi.mocked(getPlanWithClient).mockResolvedValue(mockPlan)

    const result = await getPlanStatusData(mockSupabase, planId, userId)

    expect(result.client_name).toBeNull()
  })

  it('should pass userId to repository when provided', async () => {
    vi.mocked(getPlanWithClient).mockResolvedValue({
      id: planId,
      status: 'pending' as const,
      plan_text: null,
      trainer_id: userId,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      clients: { name: 'Test' },
    })

    await getPlanStatusData(mockSupabase, planId, userId)

    expect(getPlanWithClient).toHaveBeenCalledWith(mockSupabase, planId, userId)
  })

  it('should pass undefined to repository when userId is null', async () => {
    vi.mocked(getPlanWithClient).mockResolvedValue({
      id: planId,
      status: 'pending' as const,
      plan_text: null,
      trainer_id: userId,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      clients: { name: 'Test' },
    })

    await getPlanStatusData(mockSupabase, planId, null)

    expect(getPlanWithClient).toHaveBeenCalledWith(mockSupabase, planId, undefined)
  })
})

describe('generatePlanPdfForExport', () => {
  const mockSupabase = {} as any
  const planId = 'plan-123'
  const userId = 'trainer-456'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw error if plan not found', async () => {
    vi.mocked(getPlanWithClient).mockResolvedValue(null)

    await expect(
      generatePlanPdfForExport(mockSupabase, planId, userId)
    ).rejects.toThrow(AppError)

    await expect(
      generatePlanPdfForExport(mockSupabase, planId, userId)
    ).rejects.toThrow('Plan not found')
  })

  it('should throw error if plan is not completed', async () => {
    vi.mocked(getPlanWithClient).mockResolvedValue({
      id: planId,
      status: 'generating' as const,
      plan_text: null,
      trainer_id: userId,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      clients: { name: 'John Doe' },
    })

    await expect(
      generatePlanPdfForExport(mockSupabase, planId, userId)
    ).rejects.toThrow('Plan is not ready for export')
  })

  it('should throw error if plan has no plan_text', async () => {
    vi.mocked(getPlanWithClient).mockResolvedValue({
      id: planId,
      status: 'completed' as const,
      plan_text: null,
      trainer_id: userId,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      clients: { name: 'John Doe' },
    })

    await expect(
      generatePlanPdfForExport(mockSupabase, planId, userId)
    ).rejects.toThrow('Plan is not ready for export')
  })

  it('should generate PDF with trainer and branding data', async () => {
    const mockPlan = {
      id: planId,
      status: 'completed' as const,
      plan_text: 'Full plan content...',
      trainer_id: userId,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:10:00Z',
      clients: { name: 'John Doe' },
    }

    const mockTrainer = {
      id: userId,
      full_name: 'Test Trainer',
      business_name: 'Test Fitness',
    }

    const mockBranding = {
      primary_colour: '#FF5733',
      secondary_colour: '#33FF57',
      accent_colour: '#3357FF',
    }

    const mockPdfBuffer = Buffer.from('mock-pdf-data')

    vi.mocked(getPlanWithClient).mockResolvedValue(mockPlan)
    vi.mocked(getTrainerById).mockResolvedValue(mockTrainer as any)
    vi.mocked(getBrandingColours).mockResolvedValue(mockBranding as any)
    vi.mocked(generatePlanPdf).mockResolvedValue(mockPdfBuffer)

    const result = await generatePlanPdfForExport(mockSupabase, planId, userId)

    expect(result).toEqual({
      pdfBuffer: mockPdfBuffer,
      clientName: 'John Doe',
    })

    expect(generatePlanPdf).toHaveBeenCalledWith({
      planText: 'Full plan content...',
      clientName: 'John Doe',
      trainerName: 'Test Trainer',
      businessName: 'Test Fitness',
      colours: {
        primary: '#FF5733',
        secondary: '#33FF57',
        accent: '#3357FF',
      },
      createdAt: '2024-01-01T00:00:00Z',
    })
  })

  it('should use default branding colors when branding not found', async () => {
    const mockPlan = {
      id: planId,
      status: 'completed' as const,
      plan_text: 'Full plan content...',
      trainer_id: userId,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:10:00Z',
      clients: { name: 'Jane Smith' },
    }

    vi.mocked(getPlanWithClient).mockResolvedValue(mockPlan)
    vi.mocked(getTrainerById).mockResolvedValue({ id: userId, full_name: 'Trainer' } as any)
    vi.mocked(getBrandingColours).mockResolvedValue(null)
    vi.mocked(generatePlanPdf).mockResolvedValue(Buffer.from('pdf'))

    await generatePlanPdfForExport(mockSupabase, planId, userId)

    const pdfCall = vi.mocked(generatePlanPdf).mock.calls[0][0]
    expect(pdfCall.colours.primary).toBe('#2C5F2D')
    expect(pdfCall.colours.secondary).toBe('#4A7C4E')
    expect(pdfCall.colours.accent).toBe('#FF8C00')
  })

  it('should use trainer full_name when business_name not available', async () => {
    const mockPlan = {
      id: planId,
      status: 'completed' as const,
      plan_text: 'Content',
      trainer_id: userId,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:10:00Z',
      clients: { name: 'Client' },
    }

    vi.mocked(getPlanWithClient).mockResolvedValue(mockPlan)
    vi.mocked(getTrainerById).mockResolvedValue({
      id: userId,
      full_name: 'John Trainer',
      business_name: null,
    } as any)
    vi.mocked(getBrandingColours).mockResolvedValue(null)
    vi.mocked(generatePlanPdf).mockResolvedValue(Buffer.from('pdf'))

    await generatePlanPdfForExport(mockSupabase, planId, userId)

    const pdfCall = vi.mocked(generatePlanPdf).mock.calls[0][0]
    expect(pdfCall.trainerName).toBe('John Trainer')
    expect(pdfCall.businessName).toBe('John Trainer')
  })

  it('should use default client name when client not found', async () => {
    const mockPlan = {
      id: planId,
      status: 'completed' as const,
      plan_text: 'Content',
      trainer_id: userId,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:10:00Z',
      clients: null,
    }

    vi.mocked(getPlanWithClient).mockResolvedValue(mockPlan)
    vi.mocked(getTrainerById).mockResolvedValue({ id: userId } as any)
    vi.mocked(getBrandingColours).mockResolvedValue(null)
    vi.mocked(generatePlanPdf).mockResolvedValue(Buffer.from('pdf'))

    const result = await generatePlanPdfForExport(mockSupabase, planId, userId)

    expect(result.clientName).toBe('Client')
    const pdfCall = vi.mocked(generatePlanPdf).mock.calls[0][0]
    expect(pdfCall.clientName).toBe('Client')
  })
})
