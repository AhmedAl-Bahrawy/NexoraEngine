import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type SupabaseClient = typeof supabase

// Re-export commonly used types from @supabase/supabase-js
export type { User, Session, AuthError } from '@supabase/supabase-js'

// Helper type for database rows with optional properties
export type DbRow<T> = T & {
  id: string
  created_at?: string
  updated_at?: string
}

// Type for Supabase realtime changes
export type RealtimeChange<T> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T | null
  old: T | null
}

// Re-export realtime helpers
export const REALTIME_LISTEN_TYPES = {
  POSTGRES_CHANGES: 'postgres_changes',
  BROADCAST: 'broadcast',
  PRESENCE: 'presence',
} as const

export const REALTIME_SUBSCRIBE_STATES = {
  SUBSCRIBED: 'SUBSCRIBED',
  TIMED_OUT: 'TIMED_OUT',
  CLOSED: 'CLOSED',
  CHANNEL_ERROR: 'CHANNEL_ERROR',
} as const

// Error handler utility
export function handleSupabaseError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }
  if (typeof error === 'string') {
    return new Error(error)
  }
  return new Error('An unknown Supabase error occurred')
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

// Get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw handleSupabaseError(error)
  return user
}

// Get current session
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw handleSupabaseError(error)
  return session
}

// Generic fetch helper with error handling
export async function fetchFromTable<T>(
  table: string,
  options?: {
    columns?: string
    filter?: (query: any) => any
    order?: { column: string; ascending?: boolean }
    limit?: number
    single?: boolean
  }
): Promise<T | T[] | null> {
  let query = supabase.from(table).select(options?.columns || '*')

  if (options?.filter) {
    query = options.filter(query)
  }

  if (options?.order) {
    query = query.order(options.order.column, { 
      ascending: options.order.ascending ?? true 
    })
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.single) {
    const { data, error } = await query.single()
    if (error) throw handleSupabaseError(error)
    return data as T
  }

  const { data, error } = await query
  if (error) throw handleSupabaseError(error)
  return data as T[]
}

// Generic insert helper
export async function insertIntoTable<T>(
  table: string,
  data: any
): Promise<T | T[]> {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data as any)
    .select()

  if (error) throw handleSupabaseError(error)
  return Array.isArray(data) ? (result as T[]) : (result[0] as T)
}

// Generic update helper
export async function updateTable<T>(
  table: string,
  data: any,
  match: Record<string, unknown>
): Promise<T> {
  let query = supabase.from(table).update(data)
  
  Object.entries(match).forEach(([key, value]) => {
    query = query.eq(key, value)
  })

  const { data: result, error } = await query.select().single()
  if (error) throw handleSupabaseError(error)
  return result as T
}

// Generic delete helper
export async function deleteFromTable(
  table: string,
  match: Record<string, unknown>
): Promise<void> {
  let query = supabase.from(table).delete()
  
  Object.entries(match).forEach(([key, value]) => {
    query = query.eq(key, value)
  })

  const { error } = await query
  if (error) throw handleSupabaseError(error)
}

// Subscribe to realtime changes
export function subscribeToTable<T>(
  table: string,
  callback: (payload: RealtimeChange<T>) => void,
  filter?: { event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'; filter?: string }
) {
  const channel = supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      {
        event: filter?.event || '*',
        schema: 'public',
        table: table,
        filter: filter?.filter,
      },
      (payload) => {
        callback({
          eventType: payload.eventType as RealtimeChange<T>['eventType'],
          new: payload.new as T,
          old: payload.old as T,
        })
      }
    )
    .subscribe()

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel)
    },
  }
}

// Storage helpers
export const storage = {
  async upload(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true })
    if (error) throw handleSupabaseError(error)
    return data
  },

  async getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  },

  async delete(bucket: string, paths: string[]) {
    const { error } = await supabase.storage.from(bucket).remove(paths)
    if (error) throw handleSupabaseError(error)
  },

  async list(bucket: string, path?: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path || '')
    if (error) throw handleSupabaseError(error)
    return data
  },
}

// RPC (Remote Procedure Call) helper
export async function callRpc<T = unknown>(
  functionName: string,
  params?: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase.rpc(functionName, params)
  if (error) throw handleSupabaseError(error)
  return data as T
}

// Sign out helper
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw handleSupabaseError(error)
}

// Sign in with password
export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw handleSupabaseError(error)
  return data
}

// Sign up
export async function signUp(email: string, password: string, metadata?: object) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: metadata ? { data: metadata } : undefined,
  })
  if (error) throw handleSupabaseError(error)
  return data
}

// Magic link sign in
export async function signInWithOtp(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({ email })
  if (error) throw handleSupabaseError(error)
  return data
}

// OAuth sign in
export async function signInWithOAuth(provider: 'google' | 'github' | 'gitlab' | 'azure') {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
  })
  if (error) throw handleSupabaseError(error)
  return data
}

// Reset password
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw handleSupabaseError(error)
  return data
}

// Update user
export async function updateUser(attributes: { email?: string; password?: string; data?: object }) {
  const { data, error } = await supabase.auth.updateUser(attributes)
  if (error) throw handleSupabaseError(error)
  return data
}

// Resend confirmation email
export async function resendConfirmationEmail(email: string) {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
  })
  if (error) throw handleSupabaseError(error)
  return data
}

// Exchange auth code (for OAuth callbacks)
export async function exchangeCodeForSession(code: string) {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) throw handleSupabaseError(error)
  return data
}

// Get session from URL (for OAuth callbacks)
export async function getSessionFromUrl() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw handleSupabaseError(error)
  return data
}

// Refresh session
export async function refreshSession() {
  const { data, error } = await supabase.auth.refreshSession()
  if (error) throw handleSupabaseError(error)
  return data
}

// Set session (for server-side auth)
export async function setSession(access_token: string, refresh_token: string) {
  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  })
  if (error) throw handleSupabaseError(error)
  return data
}

// Get JWT
export async function getJWT() {
  const session = await getCurrentSession()
  return session?.access_token
}

// Admin helpers (requires service role key - use only in secure server environments)
// Note: These should only be used in server-side code with proper authentication
export const admin = {
  async createUser(email: string, password: string, userMetadata?: object) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: userMetadata,
      email_confirm: true,
    })
    if (error) throw handleSupabaseError(error)
    return data
  },

  async deleteUser(uid: string) {
    const { data, error } = await supabase.auth.admin.deleteUser(uid)
    if (error) throw handleSupabaseError(error)
    return data
  },

  async listUsers() {
    const { data, error } = await supabase.auth.admin.listUsers()
    if (error) throw handleSupabaseError(error)
    return data
  },

  async updateUserById(uid: string, attributes: { email?: string; password?: string; user_metadata?: object }) {
    const { data, error } = await supabase.auth.admin.updateUserById(uid, attributes)
    if (error) throw handleSupabaseError(error)
    return data
  },
}

// File upload
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
    })
  if (error) throw handleSupabaseError(error)
  return data
}

// Batch operations
export async function batchInsert<T>(table: string, items: any[]) {
  const { data, error } = await supabase.from(table).insert(items as any).select()
  if (error) throw handleSupabaseError(error)
  return data as T[]
}

export async function batchUpdate<T>(
  table: string,
  items: { id: string; data: any }[]
) {
  const results = await Promise.all(
    items.map((item) =>
      supabase.from(table).update(item.data as any).eq('id', item.id).select().single()
    )
  )
  
  const errors = results.filter((r) => r.error).map((r) => r.error)
  if (errors.length > 0) {
    throw handleSupabaseError(errors[0])
  }
  
  return results.map((r) => r.data) as T[]
}

export async function batchDelete(table: string, ids: string[]) {
  const { error } = await supabase.from(table).delete().in('id', ids)
  if (error) throw handleSupabaseError(error)
}

// Query builder helper for complex queries
export function createQuery(table: string) {
  return {
    select: (columns = '*') => supabase.from(table).select(columns),
    insert: (data: any) => supabase.from(table).insert(data as any),
    update: (data: any) => supabase.from(table).update(data as any),
    delete: () => supabase.from(table).delete(),
    upsert: (data: any) => supabase.from(table).upsert(data as any),
  }
}

// Export everything as a default object for convenience
export default {
  client: supabase,
  storage,
  admin,
  isAuthenticated,
  getCurrentUser,
  getCurrentSession,
  fetchFromTable,
  insertIntoTable,
  updateTable,
  deleteFromTable,
  subscribeToTable,
  signOut,
  signInWithPassword,
  signUp,
  signInWithOtp,
  signInWithOAuth,
  resetPassword,
  updateUser,
  resendConfirmationEmail,
  exchangeCodeForSession,
  getSessionFromUrl,
  refreshSession,
  setSession,
  getJWT,
  callRpc,
  uploadFile,
  batchInsert,
  batchUpdate,
  batchDelete,
  createQuery,
  handleSupabaseError,
}
