import { vi } from 'vitest'

// Mock Supabase client factory
export function createMockSupabaseClient() {
  const mockData = { data: null, error: null }

  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockData),
      maybeSingle: vi.fn().mockResolvedValue(mockData),
      then: vi.fn((resolve) => resolve(mockData)),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  }
}

// Mock Stripe
export const mockStripe = {
  customers: {
    create: vi.fn(),
  },
  checkout: {
    sessions: {
      create: vi.fn(),
    },
  },
  billingPortal: {
    sessions: {
      create: vi.fn(),
    },
  },
  subscriptions: {
    retrieve: vi.fn(),
  },
}

// Mock Inngest client
export const mockInngest = {
  send: vi.fn().mockResolvedValue({ ids: ['test-event-id'] }),
}

// Mock audit log
export const mockWriteAuditLog = vi.fn()
