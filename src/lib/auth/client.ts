/**
 * Auth Client
 * Core Supabase client configuration for authentication
 */

import { createClient } from '@supabase/supabase-js'
import { ENV_KEYS } from '../constants/supabase'
import { SupabaseError } from '../utils/errors'

// Validate environment variables
function getEnvVar(key: string): string {
  const value = import.meta.env[key]
  if (!value) {
    throw new SupabaseError(
      `Missing environment variable: ${key}`,
      'config_error',
      { details: `Please add ${key} to your .env.local file` }
    )
  }
  return value
}

// Initialize Supabase client
const supabaseUrl = getEnvVar(ENV_KEYS.SUPABASE_URL)
const supabaseAnonKey = getEnvVar(ENV_KEYS.SUPABASE_ANON_KEY)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Export type
export type SupabaseClient = typeof supabase

// Re-export types
export type { User, Session, AuthError as SupabaseAuthError } from '@supabase/supabase-js'
