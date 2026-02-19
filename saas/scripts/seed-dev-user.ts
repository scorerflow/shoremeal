/**
 * Seed script: creates a dev user in Supabase for local development.
 *
 * Run with: npx tsx scripts/seed-dev-user.ts
 *
 * This creates an auth user (which triggers the handle_new_user function
 * to auto-create the trainer and branding records), then updates the
 * trainer to have a pro subscription.
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../.env.local') })

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'
const DEV_USER_EMAIL = 'dev@forzafed.test'
const DEV_USER_PASSWORD = 'devpassword123'

async function seed() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('Creating dev user...')

  // Check if user already exists
  const { data: existingUser } = await supabase.auth.admin.getUserById(DEV_USER_ID)

  if (existingUser?.user) {
    console.log('Dev user already exists, updating trainer record...')
  } else {
    // Create the auth user (triggers handle_new_user → creates trainer + branding)
    const { data, error } = await supabase.auth.admin.createUser({
      email: DEV_USER_EMAIL,
      password: DEV_USER_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'David Scorer' },
      id: DEV_USER_ID,
    })

    if (error) {
      console.error('Failed to create user:', error.message)
      process.exit(1)
    }

    console.log('Auth user created:', data.user.id)
  }

  // Update trainer to have pro subscription
  const { error: updateError } = await supabase
    .from('trainers')
    .update({
      business_name: 'Shore Fitness',
      subscription_tier: 'pro',
      subscription_status: 'active',
      plans_used_this_month: 0,
      billing_cycle_start: new Date().toISOString(),
    })
    .eq('id', DEV_USER_ID)

  if (updateError) {
    console.error('Failed to update trainer:', updateError.message)
    process.exit(1)
  }

  console.log('Trainer updated with pro subscription')
  console.log('')
  console.log('Dev user ready:')
  console.log(`  ID:       ${DEV_USER_ID}`)
  console.log(`  Email:    ${DEV_USER_EMAIL}`)
  console.log(`  Password: ${DEV_USER_PASSWORD}`)
  console.log('')
  console.log('DEV_MODE will use this user automatically.')
}

seed().catch(console.error)
