import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError, handleRouteError } from '@/lib/errors'
import { z } from 'zod'

const brandingSchema = z.object({
  primary_colour: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex colour'),
  secondary_colour: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex colour'),
  accent_colour: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex colour'),
})

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const body = await request.json()
    const parsed = brandingSchema.safeParse(body)

    if (!parsed.success) {
      return apiError('Invalid colour values', 'VALIDATION_ERROR', 400)
    }

    const { error } = await supabase
      .from('branding')
      .update({
        primary_colour: parsed.data.primary_colour,
        secondary_colour: parsed.data.secondary_colour,
        accent_colour: parsed.data.accent_colour,
        updated_at: new Date().toISOString(),
      })
      .eq('trainer_id', user.id)

    if (error) {
      console.error('Branding update error:', error)
      return apiError('Failed to update branding', 'INTERNAL_ERROR', 500)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleRouteError(error, 'branding')
  }
}
