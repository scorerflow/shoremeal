import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { handleRouteError } from '@/lib/errors'
import { updateTrainerBranding } from '@/lib/services/branding'
import { getTrainerById } from '@/lib/repositories/trainers'
import { z } from 'zod'

const brandingSchema = z.object({
  logo_url: z.string().nullable().optional(),
  primary_colour: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex colour'),
  secondary_colour: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex colour'),
  accent_colour: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex colour'),
})

export const PUT = withAuth(async (request, { user, supabase }) => {
  try {
    // Verify active subscription
    const trainer = await getTrainerById(supabase, user.id)
    if (!trainer?.subscription_tier || trainer.subscription_status !== 'active') {
      return NextResponse.json(
        { error: 'Active subscription required to update branding', code: 'SUBSCRIPTION_REQUIRED' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = brandingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid colour values', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const result = await updateTrainerBranding(supabase, user.id, parsed.data)
    return NextResponse.json(result)
  } catch (error) {
    return handleRouteError(error, 'branding')
  }
})
