// @vitest-environment node
/**
 * Plan Generation Fresh Data Test (API Level)
 *
 * CRITICAL TEST: Verifies that plan generation ALWAYS uses the latest client data.
 *
 * Scenario:
 * 1. Create client with initial data (weight: 80kg, dietary_type: 'omnivore')
 * 2. Generate plan - verify it uses initial data
 * 3. Update client data (weight: 75kg, dietary_type: 'vegan')
 * 4. Generate plan again - verify it uses UPDATED data
 *
 * This ensures client record is the single source of truth.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createTestUser, deleteTestUser } from '../../helpers/auth'
import { createTestServiceClient } from '../../helpers/db'
import { createTestRequest } from '../../helpers/request'
import type { TestUser } from '../../helpers/auth'
import { POST as generatePlan } from '@/app/api/generate/route'
import { inngest } from '@/lib/inngest/client'
import * as supabaseServer from '@/lib/supabase/server'

const dbAvailable = process.env.INTEGRATION_DB_AVAILABLE === 'true'

describe.runIf(dbAvailable)('Plan Generation API Uses Fresh Client Data', () => {
  let user: TestUser
  const supabase = createTestServiceClient()
  let inngestSpy: ReturnType<typeof vi.spyOn>
  let serviceClientSpy: ReturnType<typeof vi.spyOn>
  let capturedEvents: any[] = []

  beforeEach(async () => {
    // Create test user
    user = await createTestUser()

    // Set up trainer with active subscription
    await supabase
      .from('trainers')
      .update({
        subscription_tier: 'pro',
        subscription_status: 'active',
        plans_used_this_month: 0,
      })
      .eq('id', user.user.id)

    // Mock createServiceClient to return test client (bypasses cookies issue)
    serviceClientSpy = vi.spyOn(supabaseServer, 'createServiceClient').mockResolvedValue(supabase)

    // Mock Inngest to capture events instead of sending them
    capturedEvents = []
    inngestSpy = vi.spyOn(inngest, 'send').mockImplementation(async (event) => {
      capturedEvents.push(event)
      return { ids: ['mock-event-id'] }
    })
  })

  afterEach(async () => {
    // Cleanup
    serviceClientSpy.mockRestore()
    inngestSpy.mockRestore()
    await deleteTestUser(user.user.id)
  })

  it('should use updated client data when generating subsequent plans', async () => {
    // Step 1: Create client with initial data
    const { data: client } = await supabase
      .from('clients')
      .insert({
        trainer_id: user.user.id,
        name: 'John Doe',
        email: 'john@example.com',
        form_data: {
          age: 30,
          gender: 'M',
          height: 175,
          weight: 80, // Initial weight
          ideal_weight: 75,
          activity_level: 'moderately_active',
          goal: 'fat_loss',
          dietary_type: 'omnivore', // Initial diet type
          allergies: '',
          dislikes: '',
          preferences: '',
          budget: 70,
          cooking_skill: 'intermediate',
          prep_time: 30,
          meals_per_day: 3,
          plan_duration: 7,
          meal_prep_style: 'batch',
        },
      })
      .select()
      .single()

    expect(client).toBeDefined()
    const clientId = client!.id

    // Step 2: Generate first plan via API
    const request1 = createTestRequest('/api/generate', {
      method: 'POST',
      body: { clientId },
      authToken: user.accessToken,
    })

    const response1 = await generatePlan(request1)
    expect(response1.status).toBe(200)

    // Verify first plan used initial client data
    expect(capturedEvents).toHaveLength(1)
    const firstEvent = capturedEvents[0]
    expect(firstEvent.name).toBe('plan/generate.requested')
    expect(firstEvent.data.formData).toMatchObject({
      name: 'John Doe',
      weight: 80, // ✅ Initial weight
      dietary_type: 'omnivore', // ✅ Initial diet type
      age: 30,
      gender: 'M',
    })

    // Step 3: Update client data in database
    await supabase
      .from('clients')
      .update({
        form_data: {
          age: 30,
          gender: 'M',
          height: 175,
          weight: 75, // UPDATED weight
          ideal_weight: 70,
          activity_level: 'very_active', // UPDATED activity level
          goal: 'muscle_gain', // UPDATED goal
          dietary_type: 'vegan', // UPDATED diet type
          allergies: 'Nuts', // ADDED allergy
          dislikes: '',
          preferences: 'Asian cuisine', // ADDED preference
          budget: 100, // UPDATED budget
          cooking_skill: 'advanced', // UPDATED skill
          prep_time: 45, // UPDATED time
          meals_per_day: 4, // UPDATED meals
          plan_duration: 14, // UPDATED duration
          meal_prep_style: 'daily', // UPDATED style
        },
      })
      .eq('id', clientId)

    // Clear captured events
    capturedEvents = []

    // Step 4: Generate second plan via API
    const request2 = createTestRequest('/api/generate', {
      method: 'POST',
      body: { clientId },
      authToken: user.accessToken,
    })

    const response2 = await generatePlan(request2)
    expect(response2.status).toBe(200)

    // Step 5: Verify second plan used UPDATED client data
    expect(capturedEvents).toHaveLength(1)
    const secondEvent = capturedEvents[0]
    expect(secondEvent.name).toBe('plan/generate.requested')
    expect(secondEvent.data.formData).toMatchObject({
      name: 'John Doe',
      weight: 75, // ✅ UPDATED weight (not 80)
      dietary_type: 'vegan', // ✅ UPDATED diet type (not omnivore)
      activity_level: 'very_active', // ✅ UPDATED
      goal: 'muscle_gain', // ✅ UPDATED
      allergies: 'Nuts', // ✅ ADDED
      preferences: 'Asian cuisine', // ✅ ADDED
      budget: 100, // ✅ UPDATED
      cooking_skill: 'advanced', // ✅ UPDATED
      prep_time: 45, // ✅ UPDATED
      meals_per_day: 4, // ✅ UPDATED
      plan_duration: 14, // ✅ UPDATED
      meal_prep_style: 'daily', // ✅ UPDATED
    })

    // Additional verification: formData should NOT match old values
    expect(secondEvent.data.formData.weight).not.toBe(80)
    expect(secondEvent.data.formData.dietary_type).not.toBe('omnivore')
    expect(secondEvent.data.formData.activity_level).not.toBe('moderately_active')
    expect(secondEvent.data.formData.goal).not.toBe('fat_loss')

    console.log('✅ VERIFIED: Plan generation uses fresh client data from database')
    console.log('  Initial weight: 80kg → Second plan weight: 75kg')
    console.log('  Initial diet: omnivore → Second plan diet: vegan')
  })

  it('should fetch fresh data on every plan generation (no caching)', async () => {
    // Create client
    const { data: client } = await supabase
      .from('clients')
      .insert({
        trainer_id: user.user.id,
        name: 'Jane Smith',
        form_data: {
          age: 25,
          gender: 'F',
          height: 165,
          weight: 60,
          ideal_weight: 55,
          activity_level: 'lightly_active',
          goal: 'fat_loss',
          dietary_type: 'vegetarian',
          allergies: '',
          dislikes: '',
          preferences: '',
          budget: 50,
          cooking_skill: 'beginner',
          prep_time: 20,
          meals_per_day: 3,
          plan_duration: 7,
          meal_prep_style: 'daily',
        },
      })
      .select()
      .single()

    const clientId = client!.id

    // Generate 3 plans with data changes between each
    const expectedWeights = [60, 58, 56]

    for (let i = 0; i < 3; i++) {
      if (i > 0) {
        // Update weight before each subsequent generation
        await supabase
          .from('clients')
          .update({
            form_data: {
              age: 25,
              gender: 'F',
              height: 165,
              weight: expectedWeights[i],
              ideal_weight: 55,
              activity_level: 'lightly_active',
              goal: 'fat_loss',
              dietary_type: 'vegetarian',
              allergies: '',
              dislikes: '',
              preferences: '',
              budget: 50,
              cooking_skill: 'beginner',
              prep_time: 20,
              meals_per_day: 3,
              plan_duration: 7,
              meal_prep_style: 'daily',
            },
          })
          .eq('id', clientId)
      }

      capturedEvents = []

      const request = createTestRequest('/api/generate', {
        method: 'POST',
        body: { clientId },
        authToken: user.accessToken,
      })

      const response = await generatePlan(request)
      expect(response.status).toBe(200)

      // Verify each plan used the current weight
      expect(capturedEvents).toHaveLength(1)
      expect(capturedEvents[0].data.formData.weight).toBe(expectedWeights[i])
    }

    console.log('✅ VERIFIED: No caching - each plan fetches fresh data')
    console.log('  Plan 1: 60kg, Plan 2: 58kg, Plan 3: 56kg')
  })
})
