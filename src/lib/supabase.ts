import type { User, Session, RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './auth/client'
import { handleSupabaseError } from './utils/errors'
import { signInWithPassword as _signInWithPassword, signUp as _signUp, updateUser as _updateUser } from './auth/operations'
import { updateWhere, updateById as _updateById, deleteWhere, deleteById as _deleteById } from './database'
import { subscribeToTable as _subscribeToTable, type RealtimeEvent } from './database/realtime'

export { supabase } from './auth/client'
export type { SupabaseClient, User, Session, SupabaseAuthError } from './auth/client'

export {
  signOut,
  signInWithOTP as signInWithOtp,
  signInWithOAuth,
  resetPassword,
  updatePassword,
  getSession as getCurrentSession,
  getUser as getCurrentUser,
  isAuthenticated,
  refreshSession,
  exchangeCodeForSession,
  signInAnonymously,
  linkAnonymousAccount,
  resendConfirmationEmail,
} from './auth/operations'

export async function signInWithPassword(email: string, password: string) {
  const result = await _signInWithPassword({ email, password })
  return result
}

export async function signUp(email: string, password: string, metadata?: object) {
  const result = await _signUp({ email, password, metadata: metadata as Record<string, unknown> | undefined })
  return result
}

export async function updateUser(attributes: { email?: string; password?: string; data?: Record<string, unknown> }): Promise<User> {
  return _updateUser(attributes)
}

export async function getSessionFromUrl(): Promise<{ user: User | null; session: Session | null }> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw handleSupabaseError(error)
  return { user: data.session?.user ?? null, session: data.session }
}

export {
  fetchAll as fetchFromTable,
  fetchById,
  fetchWhere,
  insertOne as insertIntoTable,
  insertMany,
  subscribeToTable as subscribeToTableModern,
  createBroadcastChannel,
  createPresenceChannel,
  type QueryOptions,
  type RealtimeChange,
} from './database'

export async function updateTable<T>(table: string, data: Record<string, unknown>, match: Record<string, unknown>): Promise<T> {
  if (match.id && Object.keys(match).length === 1) {
    return _updateById<T>(table, match.id as string, data)
  }
  const results = await updateWhere<T>(table, match, data)
  return results[0] as T
}

export async function deleteFromTable(table: string, match: Record<string, unknown>): Promise<void> {
  if (match.id && Object.keys(match).length === 1) {
    return _deleteById(table, match.id as string)
  }
  await deleteWhere(table, match)
}

export function subscribeToTable<T extends Record<string, any>>(
  tableOrConfig: string | { table: string; event?: RealtimeEvent; filter?: string; schema?: string },
  callbackOrCallbacks: ((change: unknown) => void) | { onInsert?: (data: T) => void; onUpdate?: (data: T) => void; onDelete?: (data: T) => void; onAll?: (change: unknown) => void; onError?: (error: Error) => void },
  filter?: { event?: RealtimeEvent; filter?: string }
): RealtimeChannel {
  if (typeof tableOrConfig === 'string') {
    const table = tableOrConfig
    const callback = callbackOrCallbacks as (change: unknown) => void
    const event = filter?.event ?? '*'
    const rowFilter = filter?.filter

    return _subscribeToTable<T>(
      { table, event, filter: rowFilter, schema: 'public' },
      { onAll: callback }
    )
  }
  return _subscribeToTable<T>(tableOrConfig, callbackOrCallbacks as unknown as Parameters<typeof _subscribeToTable<T>>[1])
}

export {
  uploadFile,
  getPublicUrl,
  getSignedUrl,
  downloadFile,
  deleteFile,
  listFiles,
} from './storage'

export {
  handleSupabaseError,
  SupabaseError,
  AuthError,
  DatabaseError,
  StorageError,
  ValidationError,
  logError,
  getErrorSuggestion,
  formatErrorForDisplay,
} from './utils/errors'

export {
  REALTIME as REALTIME_LISTEN_TYPES,
  REALTIME as REALTIME_SUBSCRIBE_STATES,
} from './constants/supabase'

export type { GenericRow as DbRow } from '../types'
