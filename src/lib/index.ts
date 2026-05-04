/**
 * Supabase Library
 * Modular, professional architecture for Supabase operations
 *
 * @example
 * ```ts
 * // Import specific modules
 * import { supabase, signInWithPassword } from '@/lib/auth'
 * import { fetchAll, insertOne } from '@/lib/database'
 * import { uploadFile, getPublicUrl } from '@/lib/storage'
 *
 * // Or import everything
 * import * as supabase from '@/lib'
 * ```
 */

// Core client (re-export from auth/client)
export { supabase, type SupabaseClient } from './auth/client'

// Auth
export * from './auth'

// Database
export * from './database'

// Storage
export * from './storage'

// Utils
export * from './utils'

// Constants
export * from './constants'

// Legacy compatibility - re-export from old supabase.ts for existing code
export {
  handleSupabaseError as legacyHandleError,
  type DbRow,
  type RealtimeChange,
  REALTIME_LISTEN_TYPES,
  REALTIME_SUBSCRIBE_STATES,
} from './supabase'

