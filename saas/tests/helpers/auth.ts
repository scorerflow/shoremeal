/**
 * Auth test helpers
 * Utilities for creating and managing test users
 */

import { createTestClient, createTestServiceClient } from './db'
import type { User } from '@supabase/supabase-js'

export interface TestUser {
  email: string
  password: string
  user: User
  accessToken: string
}

/**
 * Create a test user with email/password
 */
export async function createTestUser(
  email: string = `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
  password: string = 'TestPassword123!'
): Promise<TestUser> {
  const supabase = createTestClient()

  // Sign up
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Test User',
      },
      emailRedirectTo: undefined, // Skip email confirmation in tests
    },
  })

  if (error || !data.user) {
    throw new Error(`Failed to create test user: ${error?.message}`)
  }

  // Auto-confirm email (test environment only)
  const serviceSupabase = createTestServiceClient()
  await serviceSupabase.auth.admin.updateUserById(data.user.id, {
    email_confirm: true,
  })

  // Get session
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) {
    throw new Error('Failed to get session after signup')
  }

  return {
    email,
    password,
    user: data.user,
    accessToken: sessionData.session.access_token,
  }
}

/**
 * Sign in as an existing test user
 */
export async function signInTestUser(email: string, password: string): Promise<TestUser> {
  const supabase = createTestClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    throw new Error(`Failed to sign in test user: ${error?.message}`)
  }

  return {
    email,
    password,
    user: data.user,
    accessToken: data.session.access_token,
  }
}

/**
 * Sign out test user
 */
export async function signOutTestUser() {
  const supabase = createTestClient()
  await supabase.auth.signOut({ scope: 'global' })
}

/**
 * Delete test user completely (auth + database)
 */
export async function deleteTestUser(userId: string) {
  const supabase = createTestServiceClient()

  // Delete from auth
  await supabase.auth.admin.deleteUser(userId)

  // Database cascade will handle related records
}
