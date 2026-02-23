import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { handleRouteError } from '@/lib/errors'
import { getClientPlans } from '@/lib/repositories/clients'
import { AppError } from '@/lib/errors'

export const GET = withAuth(async (request, { user, supabase }, params) => {
  try {
    const clientId = params?.id
    if (!clientId) {
      throw new AppError('Client ID is required', 'VALIDATION_ERROR', 400)
    }

    const plans = await getClientPlans(supabase, clientId, user.id)

    return NextResponse.json(plans)
  } catch (error) {
    return handleRouteError(error, 'clients.plans')
  }
})
