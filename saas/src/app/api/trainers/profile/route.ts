import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { handleRouteError } from '@/lib/errors'
import { updateTrainerProfile } from '@/lib/services/profile'
import { updateProfileSchema } from '@/lib/validation'

export const PUT = withAuth(async (request, { user, supabase }) => {
  try {
    const body = await request.json()
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid profile data', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const result = await updateTrainerProfile(supabase, user.id, parsed.data)
    return NextResponse.json(result)
  } catch (error) {
    return handleRouteError(error, 'profile')
  }
})
