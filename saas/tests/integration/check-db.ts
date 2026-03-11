/**
 * Vitest globalSetup for integration tests.
 * Runs once before any test files load. Checks Supabase connectivity
 * and sets an env var that integration tests read synchronously.
 */

import dotenv from 'dotenv'
import path from 'path'

export async function setup() {
  // Load .env.test so we have the Supabase URL
  dotenv.config({ path: path.resolve(__dirname, '../../.env.test') })

  const url = process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    process.env.INTEGRATION_DB_AVAILABLE = 'false'
    return
  }

  try {
    const response = await fetch(`${url}/rest/v1/`, {
      signal: AbortSignal.timeout(3000),
      headers: {
        apikey: process.env.TEST_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      },
    })

    const reachable = response.ok || response.status === 401 || response.status === 403
    process.env.INTEGRATION_DB_AVAILABLE = reachable ? 'true' : 'false'
  } catch {
    process.env.INTEGRATION_DB_AVAILABLE = 'false'
  }

  if (process.env.INTEGRATION_DB_AVAILABLE === 'false') {
    console.log('\n⏭  Supabase not reachable — integration tests will be skipped\n')
  }
}
