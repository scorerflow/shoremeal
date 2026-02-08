import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { generatePlanSchema } from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'
import { validationError, handleRouteError } from '@/lib/errors'
import { requestPlanGeneration } from '@/lib/services/plans'

export const POST = withAuth(async (request, { user, supabase, ip }) => {
  try {
    const rateLimitResponse = await checkRateLimit('generate', ip)
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const parsed = generatePlanSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const result = await requestPlanGeneration(supabase, user.id, parsed.data, ip)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return handleRouteError(error, 'generate')
  }
})
