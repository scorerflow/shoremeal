import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError, handleRouteError } from '@/lib/errors'
import type { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export interface AuthContext {
  user: User
  supabase: SupabaseClient
  ip: string
}

type AuthenticatedHandler = (
  request: NextRequest,
  ctx: AuthContext,
  params?: Record<string, string>
) => Promise<NextResponse>

/**
 * Wraps an API route handler with authentication.
 * Injects { user, supabase, ip } into the handler — user is guaranteed non-null.
 * The supabase client is user-scoped (RLS active).
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest, routeContext?: { params: Record<string, string> }) => {
    try {
      const ip = request.headers.get('x-forwarded-for') || 'unknown'

      const DEV_MODE = process.env.DEV_MODE === 'true'

      if (DEV_MODE) {
        // In dev mode, create a mock context with service client
        const { createServiceClient } = await import('@/lib/supabase/server')
        const supabase = await createServiceClient()
        const mockUser = { id: '00000000-0000-0000-0000-000000000001', email: 'dev@forzafed.test' } as User
        return handler(request, { user: mockUser, supabase, ip }, routeContext?.params)
      }

      // Detect test environment by checking if TEST_SUPABASE_URL is set
      const isTestEnv = !!process.env.TEST_SUPABASE_URL

      if (isTestEnv) {
        // Test environment: extract auth token from Cookie header
        const cookieHeader = request.headers.get('Cookie')
        const authToken = cookieHeader
          ?.split(';')
          .find((c) => c.trim().startsWith('auth-token='))
          ?.split('=')[1]
          ?.trim()

        if (!authToken) {
          return apiError('Unauthorized', 'UNAUTHORIZED', 401)
        }

        // Create Supabase client with the auth token
        const { createClient: createBrowserClient } = await import('@supabase/supabase-js')
        const supabase = createBrowserClient(
          process.env.TEST_SUPABASE_URL!,
          process.env.TEST_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            },
          }
        )

        const { data: { user } } = await supabase.auth.getUser(authToken)

        if (!user) {
          return apiError('Unauthorized', 'UNAUTHORIZED', 401)
        }

        return handler(request, { user, supabase, ip }, routeContext?.params)
      }

      // Production: use Next.js cookies
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return apiError('Unauthorized', 'UNAUTHORIZED', 401)
      }

      return handler(request, { user, supabase, ip }, routeContext?.params)
    } catch (error) {
      return handleRouteError(error, 'auth')
    }
  }
}

/**
 * For server components — returns { user, supabase } or redirects to /login.
 */
export async function requireAuth(): Promise<{ user: User; supabase: SupabaseClient }> {
  const DEV_MODE = process.env.DEV_MODE === 'true'

  if (DEV_MODE) {
    const { createServiceClient } = await import('@/lib/supabase/server')
    const supabase = await createServiceClient()
    const mockUser = { id: '00000000-0000-0000-0000-000000000001', email: 'dev@forzafed.test' } as User
    return { user: mockUser, supabase }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return { user, supabase }
}
