export { supabase, type SupabaseClient } from './auth/client'

export * from './auth'

export * from './database'

export * from './storage'

export * from './utils'

export * from './constants'

export * from './cache'

export * from './query-engine'

export {
  handleSupabaseError as legacyHandleError,
  type GenericRow as DbRow,
  type RealtimeChange,
  REALTIME_LISTEN_TYPES,
  REALTIME_SUBSCRIBE_STATES,
} from './supabase'
