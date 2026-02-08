import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  handleCheckoutCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handlePaymentSucceeded,
  handlePaymentFailed,
} from '../webhooks'
import type Stripe from 'stripe'

// Mock dependencies
vi.mock('@/lib/stripe', () => ({
  stripe: {
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
}))

vi.mock('@/lib/repositories/trainers', () => ({
  updateTrainerSubscription: vi.fn(),
}))

vi.mock('@/lib/audit', () => ({
  writeAuditLog: vi.fn(),
}))

import { stripe } from '@/lib/stripe'
import { updateTrainerSubscription } from '@/lib/repositories/trainers'
import { writeAuditLog } from '@/lib/audit'

describe('handleCheckoutCompleted', () => {
  const mockDb = {} as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update trainer subscription and log audit event', async () => {
    const mockSession: Partial<Stripe.Checkout.Session> = {
      id: 'cs_test123',
      customer: 'cus_123',
      subscription: 'sub_123',
    }

    const mockSubscription: Partial<Stripe.Subscription> = {
      id: 'sub_123',
      metadata: {
        tier: 'pro',
        trainer_id: 'trainer-456',
      },
    }

    vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue(mockSubscription as any)

    await handleCheckoutCompleted(mockDb, mockSession as Stripe.Checkout.Session)

    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_123')

    expect(updateTrainerSubscription).toHaveBeenCalledWith(
      mockDb,
      'trainer-456',
      expect.objectContaining({
        stripe_customer_id: 'cus_123',
        subscription_tier: 'pro',
        subscription_status: 'active',
        plans_used_this_month: 0,
      })
    )

    const updateCall = vi.mocked(updateTrainerSubscription).mock.calls[0][2]
    expect(updateCall.billing_cycle_start).toMatch(/^\d{4}-\d{2}-\d{2}T/)

    expect(writeAuditLog).toHaveBeenCalledWith({
      userId: 'trainer-456',
      action: 'subscription.created',
      resourceType: 'subscription',
      resourceId: 'sub_123',
      metadata: { tier: 'pro', customerId: 'cus_123' },
    })
  })

  it('should default to starter tier if metadata missing', async () => {
    const mockSession: Partial<Stripe.Checkout.Session> = {
      id: 'cs_test',
      customer: 'cus_123',
      subscription: 'sub_123',
    }

    const mockSubscription: Partial<Stripe.Subscription> = {
      id: 'sub_123',
      metadata: {
        trainer_id: 'trainer-789',
      },
    }

    vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue(mockSubscription as any)

    await handleCheckoutCompleted(mockDb, mockSession as Stripe.Checkout.Session)

    const updateCall = vi.mocked(updateTrainerSubscription).mock.calls[0][2]
    expect(updateCall.subscription_tier).toBe('starter')
  })
})

describe('handleSubscriptionUpdated', () => {
  const mockDb = {} as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update trainer subscription to active status', async () => {
    const mockSubscription: Partial<Stripe.Subscription> = {
      id: 'sub_123',
      status: 'active',
      metadata: {
        tier: 'agency',
        trainer_id: 'trainer-456',
      },
    }

    await handleSubscriptionUpdated(mockDb, mockSubscription as Stripe.Subscription)

    expect(updateTrainerSubscription).toHaveBeenCalledWith(mockDb, 'trainer-456', {
      subscription_tier: 'agency',
      subscription_status: 'active',
    })

    expect(writeAuditLog).toHaveBeenCalledWith({
      userId: 'trainer-456',
      action: 'subscription.updated',
      resourceType: 'subscription',
      resourceId: 'sub_123',
      metadata: { tier: 'agency', status: 'active' },
    })
  })

  it('should map past_due status correctly', async () => {
    const mockSubscription: Partial<Stripe.Subscription> = {
      id: 'sub_123',
      status: 'past_due',
      metadata: {
        tier: 'pro',
        trainer_id: 'trainer-789',
      },
    }

    await handleSubscriptionUpdated(mockDb, mockSubscription as Stripe.Subscription)

    const updateCall = vi.mocked(updateTrainerSubscription).mock.calls[0][2]
    expect(updateCall.subscription_status).toBe('past_due')
  })

  it('should map canceled status correctly', async () => {
    const mockSubscription: Partial<Stripe.Subscription> = {
      id: 'sub_123',
      status: 'canceled',
      metadata: {
        tier: 'starter',
        trainer_id: 'trainer-123',
      },
    }

    await handleSubscriptionUpdated(mockDb, mockSubscription as Stripe.Subscription)

    const updateCall = vi.mocked(updateTrainerSubscription).mock.calls[0][2]
    expect(updateCall.subscription_status).toBe('cancelled')
  })

  it('should default to active for unknown status', async () => {
    const mockSubscription: Partial<Stripe.Subscription> = {
      id: 'sub_123',
      status: 'trialing' as any,
      metadata: {
        tier: 'pro',
        trainer_id: 'trainer-456',
      },
    }

    await handleSubscriptionUpdated(mockDb, mockSubscription as Stripe.Subscription)

    const updateCall = vi.mocked(updateTrainerSubscription).mock.calls[0][2]
    expect(updateCall.subscription_status).toBe('active')
  })

  it('should skip update if trainer_id not in metadata', async () => {
    const mockSubscription: Partial<Stripe.Subscription> = {
      id: 'sub_123',
      status: 'active',
      metadata: {},
    }

    await handleSubscriptionUpdated(mockDb, mockSubscription as Stripe.Subscription)

    expect(updateTrainerSubscription).not.toHaveBeenCalled()
    expect(writeAuditLog).not.toHaveBeenCalled()
  })

  it('should default to starter tier if not in metadata', async () => {
    const mockSubscription: Partial<Stripe.Subscription> = {
      id: 'sub_123',
      status: 'active',
      metadata: {
        trainer_id: 'trainer-123',
      },
    }

    await handleSubscriptionUpdated(mockDb, mockSubscription as Stripe.Subscription)

    const updateCall = vi.mocked(updateTrainerSubscription).mock.calls[0][2]
    expect(updateCall.subscription_tier).toBe('starter')
  })
})

describe('handleSubscriptionDeleted', () => {
  const mockDb = {} as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update trainer subscription to cancelled', async () => {
    const mockSubscription: Partial<Stripe.Subscription> = {
      id: 'sub_123',
      metadata: {
        trainer_id: 'trainer-456',
      },
    }

    await handleSubscriptionDeleted(mockDb, mockSubscription as Stripe.Subscription)

    expect(updateTrainerSubscription).toHaveBeenCalledWith(mockDb, 'trainer-456', {
      subscription_tier: null,
      subscription_status: 'cancelled',
    })

    expect(writeAuditLog).toHaveBeenCalledWith({
      userId: 'trainer-456',
      action: 'subscription.cancelled',
      resourceType: 'subscription',
      resourceId: 'sub_123',
    })
  })

  it('should skip update if trainer_id not in metadata', async () => {
    const mockSubscription: Partial<Stripe.Subscription> = {
      id: 'sub_123',
      metadata: {},
    }

    await handleSubscriptionDeleted(mockDb, mockSubscription as Stripe.Subscription)

    expect(updateTrainerSubscription).not.toHaveBeenCalled()
    expect(writeAuditLog).not.toHaveBeenCalled()
  })
})

describe('handlePaymentSucceeded', () => {
  const mockDb = {} as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reset plan counter for subscription_cycle invoices', async () => {
    const mockInvoice: Partial<Stripe.Invoice> = {
      id: 'in_123',
      billing_reason: 'subscription_cycle',
      subscription: 'sub_123',
    }

    const mockSubscription: Partial<Stripe.Subscription> = {
      id: 'sub_123',
      metadata: {
        trainer_id: 'trainer-456',
      },
    }

    vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue(mockSubscription as any)

    await handlePaymentSucceeded(mockDb, mockInvoice as Stripe.Invoice)

    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_123')

    expect(updateTrainerSubscription).toHaveBeenCalledWith(
      mockDb,
      'trainer-456',
      expect.objectContaining({
        plans_used_this_month: 0,
      })
    )

    const updateCall = vi.mocked(updateTrainerSubscription).mock.calls[0][2]
    expect(updateCall.billing_cycle_start).toMatch(/^\d{4}-\d{2}-\d{2}T/)

    expect(writeAuditLog).toHaveBeenCalledWith({
      userId: 'trainer-456',
      action: 'subscription.payment_succeeded',
      resourceType: 'invoice',
      resourceId: 'in_123',
    })
  })

  it('should skip processing for non-subscription_cycle invoices', async () => {
    const mockInvoice: Partial<Stripe.Invoice> = {
      id: 'in_123',
      billing_reason: 'manual',
      subscription: 'sub_123',
    }

    await handlePaymentSucceeded(mockDb, mockInvoice as Stripe.Invoice)

    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled()
    expect(updateTrainerSubscription).not.toHaveBeenCalled()
    expect(writeAuditLog).not.toHaveBeenCalled()
  })

  it('should skip if trainer_id not in subscription metadata', async () => {
    const mockInvoice: Partial<Stripe.Invoice> = {
      id: 'in_123',
      billing_reason: 'subscription_cycle',
      subscription: 'sub_123',
    }

    const mockSubscription: Partial<Stripe.Subscription> = {
      id: 'sub_123',
      metadata: {},
    }

    vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue(mockSubscription as any)

    await handlePaymentSucceeded(mockDb, mockInvoice as Stripe.Invoice)

    expect(updateTrainerSubscription).not.toHaveBeenCalled()
    expect(writeAuditLog).not.toHaveBeenCalled()
  })
})

describe('handlePaymentFailed', () => {
  const mockDb = {} as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update trainer subscription to past_due', async () => {
    const mockInvoice: Partial<Stripe.Invoice> = {
      id: 'in_123',
      subscription: 'sub_123',
    }

    const mockSubscription: Partial<Stripe.Subscription> = {
      id: 'sub_123',
      metadata: {
        trainer_id: 'trainer-456',
      },
    }

    vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue(mockSubscription as any)

    await handlePaymentFailed(mockDb, mockInvoice as Stripe.Invoice)

    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_123')

    expect(updateTrainerSubscription).toHaveBeenCalledWith(mockDb, 'trainer-456', {
      subscription_status: 'past_due',
    })

    expect(writeAuditLog).toHaveBeenCalledWith({
      userId: 'trainer-456',
      action: 'subscription.payment_failed',
      resourceType: 'invoice',
      resourceId: 'in_123',
    })
  })

  it('should skip if trainer_id not in subscription metadata', async () => {
    const mockInvoice: Partial<Stripe.Invoice> = {
      id: 'in_123',
      subscription: 'sub_123',
    }

    const mockSubscription: Partial<Stripe.Subscription> = {
      id: 'sub_123',
      metadata: {},
    }

    vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue(mockSubscription as any)

    await handlePaymentFailed(mockDb, mockInvoice as Stripe.Invoice)

    expect(updateTrainerSubscription).not.toHaveBeenCalled()
    expect(writeAuditLog).not.toHaveBeenCalled()
  })
})
