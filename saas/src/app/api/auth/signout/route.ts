import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { writeAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  // Rate limiting by IP
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rateLimitResponse = await checkRateLimit('auth', ip)
  if (rateLimitResponse) return rateLimitResponse

  const supabase = await createClient()

  // Get user before signing out (for audit log)
  const { data: { user } } = await supabase.auth.getUser()

  // Sign out with global scope to clear all sessions
  await supabase.auth.signOut({ scope: 'global' })

  // Fire-and-forget audit log
  if (user) {
    writeAuditLog({
      userId: user.id,
      action: 'auth.signout',
      ipAddress: ip,
    })
  }

  // Revalidate auth-dependent paths
  revalidatePath('/', 'layout')

  // Get the origin from the request
  const origin = request.nextUrl.origin
  return NextResponse.redirect(new URL('/login', origin))
}
