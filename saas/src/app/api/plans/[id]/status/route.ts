import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/auth'
import { handleRouteError } from '@/lib/errors'
import { getPlanStatusData } from '@/lib/services/plans'

export const GET = withAuth(async (request: NextRequest, { user, ip }, params) => {
  try {
    const planId = params?.id as string
    const supabase = await createServiceClient()

    const data = await getPlanStatusData(supabase, planId, user.id)
    return NextResponse.json(data)
  } catch (error) {
    return handleRouteError(error, 'plans/status')
  }
})
