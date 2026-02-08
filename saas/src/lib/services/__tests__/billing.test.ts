import { describe, it, expect, vi, beforeEach } from 'vitest'
import { initiateCheckout, createBillingPortal } from '../billing'
import { AppError } from '@/lib/errors'

// Mock dependencies
vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
  PRICE_IDS: {
    starter: 'price_starter_123',
    pro: 'price_pro_123',
    agency: 'price_agency_123',
  },
  createCustomer: vi.fn(),
  createCustomerPortalSession: vi.fn(),
}))

vi.mock('@/lib/repositories/trainers', () => ({
  getTrainerForCheckout: vi.fn(),
  getTrainerStripeId: vi.fn(),
  updateStripeCustomerId: vi.fn(),
}))

vi.mock('@/lib/audit', () => ({
  writeAuditLog: vi.fn(),
}))

import { stripe, createCustomer, createCustomerPortalSession } from '@/lib/stripe'
import { getTrainerForCheckout, getTrainerStripeId, updateStripeCustomerId } from '@/lib/repositories/trainers'
import { writeAuditLog } from '@/lib/audit'

describe('initiateCheckout', () => {
  const mockSupabase = {} as any
  const userId = 'trainer-123'
  const userEmail = 'trainer@test.com'

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'
  })

  it('should throw error for invalid tier', async () => {
    await expect(
      initiateCheckout(mockSupabase, userId, userEmail, 'enterprise')
    ).rejects.toThrow(AppError)

    await expect(
      initiateCheckout(mockSupabase, userId, userEmail, 'enterprise')
    ).rejects.toThrow('Invalid tier')
  })

  it('should create new Stripe customer if trainer has no customer ID', async () => {
    const mockTrainer = {
      stripe_customer_id: null,
      email: 'trainer@test.com',
      full_name: 'Test Trainer',
    }

    const mockCustomer = { id: 'cus_new123' }
    const mockSession = {
      id: 'cs_test123',
      url: 'https://checkout.stripe.com/test',
    }

    vi.mocked(getTrainerForCheckout).mockResolvedValue(mockTrainer)
    vi.mocked(createCustomer).mockResolvedValue(mockCustomer as any)
    vi.mocked(updateStripeCustomerId).mockResolvedValue()
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue(mockSession as any)

    const result = await initiateCheckout(mockSupabase, userId, userEmail, 'pro')

    expect(createCustomer).toHaveBeenCalledWith('trainer@test.com', 'Test Trainer')
    expect(updateStripeCustomerId).toHaveBeenCalledWith(mockSupabase, userId, 'cus_new123')
    expect(result.url).toBe('https://checkout.stripe.com/test')
  })

  it('should use existing Stripe customer ID if available', async () => {
    const mockTrainer = {
      stripe_customer_id: 'cus_existing456',
      email: 'trainer@test.com',
      full_name: 'Test Trainer',
    }

    const mockSession = {
      id: 'cs_test123',
      url: 'https://checkout.stripe.com/test',
    }

    vi.mocked(getTrainerForCheckout).mockResolvedValue(mockTrainer)
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue(mockSession as any)

    await initiateCheckout(mockSupabase, userId, userEmail, 'starter')

    expect(createCustomer).not.toHaveBeenCalled()
    expect(updateStripeCustomerId).not.toHaveBeenCalled()

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
      customer: 'cus_existing456',
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_starter_123',
          quantity: 1,
        },
      ],
      success_url: 'https://example.com/dashboard?success=true',
      cancel_url: 'https://example.com/pricing?cancelled=true',
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          trainer_id: userId,
          tier: 'starter',
        },
      },
    })
  })

  it('should create checkout session with correct tier metadata', async () => {
    const mockTrainer = {
      stripe_customer_id: 'cus_123',
      email: 'trainer@test.com',
      full_name: 'Test Trainer',
    }

    const mockSession = {
      id: 'cs_test123',
      url: 'https://checkout.stripe.com/test',
    }

    vi.mocked(getTrainerForCheckout).mockResolvedValue(mockTrainer)
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue(mockSession as any)

    await initiateCheckout(mockSupabase, userId, userEmail, 'agency')

    const createCall = vi.mocked(stripe.checkout.sessions.create).mock.calls[0][0] as any
    expect(createCall.line_items[0].price).toBe('price_agency_123')
    expect(createCall.subscription_data?.metadata).toEqual({
      trainer_id: userId,
      tier: 'agency',
    })
  })

  it('should use userEmail when trainer email not available', async () => {
    const mockTrainer = {
      stripe_customer_id: null,
      email: '',
      full_name: null,
    }

    const mockCustomer = { id: 'cus_new789' }
    const mockSession = { id: 'cs_test', url: 'https://checkout.stripe.com/test' }

    vi.mocked(getTrainerForCheckout).mockResolvedValue(mockTrainer)
    vi.mocked(createCustomer).mockResolvedValue(mockCustomer as any)
    vi.mocked(updateStripeCustomerId).mockResolvedValue()
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue(mockSession as any)

    await initiateCheckout(mockSupabase, userId, userEmail, 'pro')

    expect(createCustomer).toHaveBeenCalledWith(userEmail, undefined)
  })

  it('should return session URL', async () => {
    const mockTrainer = {
      stripe_customer_id: 'cus_123',
      email: 'trainer@test.com',
      full_name: 'Test Trainer',
    }

    const mockSession = {
      id: 'cs_test123',
      url: 'https://checkout.stripe.com/pay/abc123',
    }

    vi.mocked(getTrainerForCheckout).mockResolvedValue(mockTrainer)
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue(mockSession as any)

    const result = await initiateCheckout(mockSupabase, userId, userEmail, 'pro')

    expect(result).toEqual({ url: 'https://checkout.stripe.com/pay/abc123' })
  })
})

describe('createBillingPortal', () => {
  const mockSupabase = {} as any
  const userId = 'trainer-123'
  const ip = '127.0.0.1'

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'
  })

  it('should throw error if trainer has no Stripe customer ID', async () => {
    vi.mocked(getTrainerStripeId).mockResolvedValue(null)

    await expect(
      createBillingPortal(mockSupabase, userId, ip)
    ).rejects.toThrow(AppError)

    await expect(
      createBillingPortal(mockSupabase, userId, ip)
    ).rejects.toThrow('No active subscription')
  })

  it('should create billing portal session and log audit event', async () => {
    const stripeCustomerId = 'cus_123'
    const mockSession = {
      id: 'bps_test123',
      url: 'https://billing.stripe.com/session/abc123',
    }

    vi.mocked(getTrainerStripeId).mockResolvedValue(stripeCustomerId)
    vi.mocked(createCustomerPortalSession).mockResolvedValue(mockSession as any)

    const result = await createBillingPortal(mockSupabase, userId, ip)

    expect(createCustomerPortalSession).toHaveBeenCalledWith(
      stripeCustomerId,
      'https://example.com/dashboard'
    )

    expect(writeAuditLog).toHaveBeenCalledWith({
      userId,
      action: 'billing.portal_accessed',
      resourceType: 'billing',
      ipAddress: ip,
    })

    expect(result).toEqual({ url: 'https://billing.stripe.com/session/abc123' })
  })

  it('should return portal URL on success', async () => {
    const mockSession = {
      id: 'bps_test456',
      url: 'https://billing.stripe.com/portal/xyz',
    }

    vi.mocked(getTrainerStripeId).mockResolvedValue('cus_456')
    vi.mocked(createCustomerPortalSession).mockResolvedValue(mockSession as any)

    const result = await createBillingPortal(mockSupabase, userId, ip)

    expect(result.url).toBe('https://billing.stripe.com/portal/xyz')
  })
})
