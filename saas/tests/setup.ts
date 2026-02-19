/**
 * Global test setup
 * Runs once before all tests
 */

import { beforeAll, afterAll, beforeEach } from 'vitest'
import dotenv from 'dotenv'
import path from 'path'

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test') })

// Verify required env vars
const requiredEnvVars = [
  'TEST_SUPABASE_URL',
  'TEST_SUPABASE_ANON_KEY',
  'TEST_SUPABASE_SERVICE_KEY',
]

beforeAll(() => {
  const missing = requiredEnvVars.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(
      `Missing required test environment variables: ${missing.join(', ')}\n` +
      'Create a .env.test file with TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, and TEST_SUPABASE_SERVICE_KEY'
    )
  }

  console.log('✓ Test environment loaded')
})

afterAll(() => {
  console.log('✓ Test suite complete')
})
