import { describe, it, expect, vi } from 'vitest'

vi.mock('stripe', () => {
  return {
    default: class MockStripe {
      checkout = { sessions: { create: vi.fn() } }
      billingPortal = { sessions: { create: vi.fn() } }
      customers = { create: vi.fn() }
      subscriptions = { retrieve: vi.fn() }
    },
  }
})

vi.mock('@/lib/config', () => ({
  APP_CONFIG: {
    stripe: {
      priceIds: {
        starter: 'price_starter_123',
        pro: 'price_pro_456',
        agency: 'price_agency_789',
      },
    },
  },
}))

import { getTierFromPriceId, PRICE_IDS } from '@/lib/stripe'

describe('getTierFromPriceId', () => {
  it('should return starter for starter price ID', () => {
    expect(getTierFromPriceId('price_starter_123')).toBe('starter')
  })

  it('should return pro for pro price ID', () => {
    expect(getTierFromPriceId('price_pro_456')).toBe('pro')
  })

  it('should return agency for agency price ID', () => {
    expect(getTierFromPriceId('price_agency_789')).toBe('agency')
  })

  it('should return null for unknown price ID', () => {
    expect(getTierFromPriceId('price_unknown')).toBeNull()
  })

  it('should return null for empty string', () => {
    expect(getTierFromPriceId('')).toBeNull()
  })

  it('should use PRICE_IDS as source of truth', () => {
    expect(PRICE_IDS.starter).toBe('price_starter_123')
    expect(PRICE_IDS.pro).toBe('price_pro_456')
    expect(PRICE_IDS.agency).toBe('price_agency_789')
  })
})
