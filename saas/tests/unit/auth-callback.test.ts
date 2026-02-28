/**
 * Unit tests for /auth/callback route (MOCKED - no real Supabase calls)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockExchangeCodeForSession = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession,
      },
    }),
}))

const { GET } = await import('@/app/auth/callback/route')

describe('GET /auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should exchange code and redirect to dashboard on success', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null })

    const request = new Request('https://www.forzafed.com/auth/callback?code=test-code')
    const response = await GET(request)

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('test-code')
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://www.forzafed.com/dashboard')
  })

  it('should redirect to custom next path on success', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null })

    const request = new Request('https://www.forzafed.com/auth/callback?code=test-code&next=/dashboard/settings')
    const response = await GET(request)

    expect(response.headers.get('location')).toBe('https://www.forzafed.com/dashboard/settings')
  })

  it('should redirect to login with confirmed=true when code exchange fails', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: new Error('expired') })

    const request = new Request('https://www.forzafed.com/auth/callback?code=bad-code')
    const response = await GET(request)

    expect(response.headers.get('location')).toBe('https://www.forzafed.com/login?confirmed=true')
  })

  it('should redirect to login with confirmed=true when no code provided', async () => {
    const request = new Request('https://www.forzafed.com/auth/callback')
    const response = await GET(request)

    expect(mockExchangeCodeForSession).not.toHaveBeenCalled()
    expect(response.headers.get('location')).toBe('https://www.forzafed.com/login?confirmed=true')
  })
})
