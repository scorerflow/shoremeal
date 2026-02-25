/**
 * Unit tests for email service (MOCKED - no real database or email calls)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendPlanToClient } from '@/lib/services/email'
import type { SupabaseClient } from '@supabase/supabase-js'

// Mock all dependencies
vi.mock('@/lib/repositories/plans', () => ({
  getPlanWithClient: vi.fn(),
}))

vi.mock('@/lib/repositories/clients', () => ({
  getClientById: vi.fn(),
}))

vi.mock('@/lib/repositories/trainers', () => ({
  getTrainerById: vi.fn(),
}))

vi.mock('@/lib/repositories/branding', () => ({
  getBrandingColours: vi.fn(),
}))

vi.mock('@/lib/pdf/generate', () => ({
  generatePlanPdf: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
  sendPlanEmail: vi.fn(),
}))

vi.mock('@/lib/audit', () => ({
  writeAuditLog: vi.fn(),
}))

// Import mocked modules
import { getPlanWithClient } from '@/lib/repositories/plans'
import { getClientById } from '@/lib/repositories/clients'
import { getTrainerById } from '@/lib/repositories/trainers'
import { getBrandingColours } from '@/lib/repositories/branding'
import { generatePlanPdf } from '@/lib/pdf/generate'
import { sendPlanEmail } from '@/lib/email'
import { writeAuditLog } from '@/lib/audit'

const mockGetPlan = getPlanWithClient as ReturnType<typeof vi.fn>
const mockGetClient = getClientById as ReturnType<typeof vi.fn>
const mockGetTrainer = getTrainerById as ReturnType<typeof vi.fn>
const mockGetBranding = getBrandingColours as ReturnType<typeof vi.fn>
const mockGeneratePdf = generatePlanPdf as ReturnType<typeof vi.fn>
const mockSendEmail = sendPlanEmail as ReturnType<typeof vi.fn>
const mockAuditLog = writeAuditLog as ReturnType<typeof vi.fn>

describe('sendPlanToClient', () => {
  const mockSupabase = {} as SupabaseClient
  const planId = 'plan-123'
  const userId = 'user-456'
  const ip = '127.0.0.1'

  const defaultPlan = {
    id: planId,
    client_id: 'client-789',
    status: 'completed' as const,
    plan_text: '# Day 1\n## Breakfast\nOatmeal with berries',
    trainer_id: userId,
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:05:00Z',
    clients: { name: 'Jane Doe' },
  }

  const defaultClient = {
    id: 'client-789',
    trainer_id: userId,
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: null,
    form_data: {},
    last_plan_date: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }

  const defaultTrainer = {
    id: userId,
    email: 'mike@fitco.com',
    full_name: 'Mike Johnson',
    business_name: 'FitCo',
    stripe_customer_id: null,
    subscription_tier: 'pro',
    subscription_status: 'active',
    plans_used_this_month: 5,
    billing_cycle_start: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  }

  const defaultBranding = {
    primary_colour: '#FF5500',
    secondary_colour: '#333333',
    accent_colour: '#00AAFF',
    logo_url: null as string | null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPlan.mockResolvedValue(defaultPlan)
    mockGetClient.mockResolvedValue(defaultClient)
    mockGetTrainer.mockResolvedValue(defaultTrainer)
    mockGetBranding.mockResolvedValue(defaultBranding)
    mockGeneratePdf.mockResolvedValue(Buffer.from('fake-pdf'))
    mockSendEmail.mockResolvedValue('email-abc-123')
    mockAuditLog.mockResolvedValue(undefined)
  })

  it('should send email and return emailId + sentTo on success', async () => {
    const result = await sendPlanToClient(mockSupabase, planId, userId, ip)

    expect(result).toEqual({
      emailId: 'email-abc-123',
      sentTo: 'jane@example.com',
    })
  })

  it('should call getPlanWithClient with correct params', async () => {
    await sendPlanToClient(mockSupabase, planId, userId, ip)

    expect(mockGetPlan).toHaveBeenCalledWith(mockSupabase, planId, userId)
  })

  it('should call getClientById with the plan client_id', async () => {
    await sendPlanToClient(mockSupabase, planId, userId, ip)

    expect(mockGetClient).toHaveBeenCalledWith(mockSupabase, 'client-789')
  })

  it('should fetch trainer and branding in parallel', async () => {
    await sendPlanToClient(mockSupabase, planId, userId, ip)

    expect(mockGetTrainer).toHaveBeenCalledWith(mockSupabase, userId)
    expect(mockGetBranding).toHaveBeenCalledWith(mockSupabase, userId)
  })

  it('should generate PDF with correct options', async () => {
    await sendPlanToClient(mockSupabase, planId, userId, ip)

    expect(mockGeneratePdf).toHaveBeenCalledWith({
      planText: defaultPlan.plan_text,
      clientName: 'Jane Doe',
      trainerName: 'Mike Johnson',
      businessName: 'FitCo',
      colours: {
        primary: '#FF5500',
        secondary: '#333333',
        accent: '#00AAFF',
      },
      createdAt: defaultPlan.created_at,
      logoUrl: null,
    })
  })

  it('should send email with correct params', async () => {
    await sendPlanToClient(mockSupabase, planId, userId, ip)

    expect(mockSendEmail).toHaveBeenCalledWith({
      to: 'jane@example.com',
      clientName: 'Jane Doe',
      trainerName: 'Mike Johnson',
      businessName: 'FitCo',
      trainerEmail: 'mike@fitco.com',
      primaryColour: '#FF5500',
      pdfBuffer: Buffer.from('fake-pdf'),
      pdfFilename: 'Jane_Doe_Nutrition_Plan.pdf',
    })
  })

  it('should write audit log with correct metadata', async () => {
    await sendPlanToClient(mockSupabase, planId, userId, ip)

    expect(mockAuditLog).toHaveBeenCalledWith({
      userId,
      action: 'plan.email_sent',
      resourceType: 'plan',
      resourceId: planId,
      metadata: {
        clientId: 'client-789',
        clientEmail: 'jane@example.com',
        emailId: 'email-abc-123',
      },
      ipAddress: ip,
    })
  })

  it('should throw when plan not found', async () => {
    mockGetPlan.mockResolvedValue(null)

    await expect(sendPlanToClient(mockSupabase, planId, userId, ip))
      .rejects.toThrow('Plan not found')
  })

  it('should throw when plan is not completed', async () => {
    mockGetPlan.mockResolvedValue({ ...defaultPlan, status: 'pending' })

    await expect(sendPlanToClient(mockSupabase, planId, userId, ip))
      .rejects.toThrow('Plan is not ready to send')
  })

  it('should throw when plan has no text', async () => {
    mockGetPlan.mockResolvedValue({ ...defaultPlan, plan_text: null })

    await expect(sendPlanToClient(mockSupabase, planId, userId, ip))
      .rejects.toThrow('Plan is not ready to send')
  })

  it('should throw when client not found', async () => {
    mockGetClient.mockResolvedValue(null)

    await expect(sendPlanToClient(mockSupabase, planId, userId, ip))
      .rejects.toThrow('Client not found')
  })

  it('should throw when client has no email', async () => {
    mockGetClient.mockResolvedValue({ ...defaultClient, email: null })

    await expect(sendPlanToClient(mockSupabase, planId, userId, ip))
      .rejects.toThrow('Client does not have an email address')
  })

  it('should throw when client email is invalid', async () => {
    mockGetClient.mockResolvedValue({ ...defaultClient, email: 'not-an-email' })

    await expect(sendPlanToClient(mockSupabase, planId, userId, ip))
      .rejects.toThrow('Client email address is invalid')
  })

  it('should propagate Resend failures', async () => {
    mockSendEmail.mockRejectedValue(new Error('Resend API timeout'))

    await expect(sendPlanToClient(mockSupabase, planId, userId, ip))
      .rejects.toThrow('Resend API timeout')
  })

  it('should use fallback trainer name when no full_name', async () => {
    mockGetTrainer.mockResolvedValue({
      ...defaultTrainer,
      full_name: null,
      business_name: 'FitCo',
    })

    await sendPlanToClient(mockSupabase, planId, userId, ip)

    expect(mockGeneratePdf).toHaveBeenCalledWith(
      expect.objectContaining({ trainerName: 'FitCo' })
    )
  })

  it('should use default fallback when no trainer name at all', async () => {
    mockGetTrainer.mockResolvedValue({
      ...defaultTrainer,
      full_name: null,
      business_name: null,
    })

    await sendPlanToClient(mockSupabase, planId, userId, ip)

    expect(mockGeneratePdf).toHaveBeenCalledWith(
      expect.objectContaining({
        trainerName: 'Your Trainer',
        businessName: 'Your Trainer',
      })
    )
  })

  it('should use default branding colours when no branding record', async () => {
    mockGetBranding.mockResolvedValue(null)

    await sendPlanToClient(mockSupabase, planId, userId, ip)

    expect(mockGeneratePdf).toHaveBeenCalledWith(
      expect.objectContaining({
        colours: {
          primary: '#2C5F2D',
          secondary: '#4A7C4E',
          accent: '#FF8C00',
        },
      })
    )
  })

  it('should sanitize client name in PDF filename', async () => {
    mockGetPlan.mockResolvedValue({
      ...defaultPlan,
      clients: { name: 'O\'Brien & Sons' },
    })

    await sendPlanToClient(mockSupabase, planId, userId, ip)

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        pdfFilename: 'O_Brien___Sons_Nutrition_Plan.pdf',
      })
    )
  })
})
