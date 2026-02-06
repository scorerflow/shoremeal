import { NextResponse } from 'next/server'

type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

type RateLimiter = {
  limit: (identifier: string) => Promise<RateLimitResult>
}

function createRateLimiter(maxRequests: number, windowMs: number): RateLimiter | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }

  // Lazy import to avoid errors when env vars are not set
  let limiter: RateLimiter | null = null

  return {
    async limit(identifier: string): Promise<RateLimitResult> {
      if (!limiter) {
        const { Ratelimit } = await import('@upstash/ratelimit')
        const { Redis } = await import('@upstash/redis')

        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        })

        limiter = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs}ms`),
          analytics: false,
        })
      }

      return limiter.limit(identifier)
    },
  }
}

// 10 req/min per user for plan generation
const _generateRateLimit = createRateLimiter(10, 60_000)

// 5 attempts per 15 min for auth (brute force protection)
const _authRateLimit = createRateLimiter(5, 15 * 60_000)

// 10 req/min for billing operations
const _billingRateLimit = createRateLimiter(10, 60_000)

export async function checkRateLimit(
  type: 'generate' | 'auth' | 'billing',
  identifier: string
): Promise<NextResponse | null> {
  const limiters = {
    generate: _generateRateLimit,
    auth: _authRateLimit,
    billing: _billingRateLimit,
  }

  const limiter = limiters[type]

  // No-op if Upstash is not configured (dev without Upstash)
  if (!limiter) {
    return null
  }

  const result = await limiter.limit(identifier)

  if (!result.success) {
    const retryAfterSeconds = Math.ceil((result.reset - Date.now()) / 1000)

    return NextResponse.json(
      {
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSeconds),
        },
      }
    )
  }

  return null
}
