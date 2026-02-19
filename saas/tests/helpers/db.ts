/**
 * Database test helpers
 * Utilities for managing test database state
 */

import { createClient } from '@supabase/supabase-js'

export function createTestClient() {
  return createClient(
    process.env.TEST_SUPABASE_URL!,
    process.env.TEST_SUPABASE_ANON_KEY!
  )
}

export function createTestServiceClient() {
  return createClient(
    process.env.TEST_SUPABASE_URL!,
    process.env.TEST_SUPABASE_SERVICE_KEY!
  )
}

/**
 * Clean up test data for a specific trainer
 */
export async function cleanupTrainerData(trainerId: string) {
  const supabase = createTestServiceClient()

  // Delete in correct order (respecting foreign keys)
  await supabase.from('plans').delete().eq('trainer_id', trainerId)
  await supabase.from('clients').delete().eq('trainer_id', trainerId)
  await supabase.from('branding').delete().eq('trainer_id', trainerId)
  await supabase.from('trainers').delete().eq('id', trainerId)
}

/**
 * Clean up all test data (use with caution!)
 */
export async function cleanupAllTestData() {
  const supabase = createTestServiceClient()

  // Only delete test users (emails ending with .test)
  const { data: testTrainers } = await supabase
    .from('trainers')
    .select('id')
    .like('email', '%.test')

  if (testTrainers) {
    for (const trainer of testTrainers) {
      await cleanupTrainerData(trainer.id)
    }
  }
}

/**
 * Wait for async database operations to complete
 */
export async function waitForDb(ms: number = 1000) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}
