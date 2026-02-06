import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { writeAuditLog } from '@/lib/audit'

export async function POST(request: NextRequest) {
  // Rate limiting by IP
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rateLimitResponse = await checkRateLimit('auth', ip)
  if (rateLimitResponse) return rateLimitResponse

  const supabase = await createClient()

  // Get user before signing out (for audit log)
  const { data: { user } } = await supabase.auth.getUser()

  await supabase.auth.signOut()

  // Fire-and-forget audit log
  if (user) {
    writeAuditLog({
      userId: user.id,
      action: 'auth.signout',
      ipAddress: ip,
    })
  }

  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL))
}
