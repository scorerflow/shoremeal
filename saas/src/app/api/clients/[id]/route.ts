import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { handleRouteError } from '@/lib/errors'
import { getClientById } from '@/lib/repositories/clients'
import { AppError } from '@/lib/errors'

export const GET = withAuth(async (request, { user, supabase }, params) => {
  try {
    const clientId = params?.id
    if (!clientId) {
      throw new AppError('Client ID is required', 'VALIDATION_ERROR', 400)
    }

    const client = await getClientById(supabase, clientId)

    if (!client) {
      throw new AppError('Client not found', 'FORBIDDEN', 404)
    }

    // Verify the client belongs to the authenticated user
    if (client.trainer_id !== user.id) {
      throw new AppError('Client not found', 'FORBIDDEN', 404)
    }

    // Return the form data fields for pre-filling
    const formData = client.form_data

    return NextResponse.json({
      id: client.id,
      name: client.name,
      age: formData.age,
      gender: formData.gender,
      height: formData.height,
      weight: formData.weight,
      ideal_weight: formData.ideal_weight,
      activity_level: formData.activity_level,
      goal: formData.goal,
      dietary_type: formData.dietary_type,
      allergies: formData.allergies,
      dislikes: formData.dislikes,
      preferences: formData.preferences,
      budget: formData.budget,
      cooking_skill: formData.cooking_skill,
      prep_time: formData.prep_time,
      meals_per_day: formData.meals_per_day,
      plan_duration: formData.plan_duration,
      meal_prep_style: formData.meal_prep_style,
    })
  } catch (error) {
    return handleRouteError(error, 'clients.get')
  }
})
