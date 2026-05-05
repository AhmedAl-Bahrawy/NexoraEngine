import { createClient } from '@supabase/supabase-js'
import { SupabaseError } from '../utils/errors'

export type SupabaseClient = ReturnType<typeof createClient>

export type { User, Session, AuthError as SupabaseAuthError } from '@supabase/supabase-js'

export interface SupabaseConfig {
  url: string
  anonKey: string
  options?: {
    auth?: {
      autoRefreshToken?: boolean
      persistSession?: boolean
      detectSessionInUrl?: boolean
      storage?: unknown
      storageKey?: string
    }
    global?: {
      headers?: Record<string, string>
      fetch?: typeof fetch
    }
    db?: {
      schema?: string
    }
  }
}

let clientInstance: SupabaseClient | null = null

function resolveEnvValue(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key]
  }
  try {
    const meta = globalThis as unknown as { importMeta?: { env?: Record<string, string> } }
    if (meta.importMeta?.env) {
      return meta.importMeta.env[key]
    }
  } catch {
    // ignore
  }
  return undefined
}

export function createSupabaseClient(config: SupabaseConfig): SupabaseClient {
  if (!config.url || !config.anonKey) {
    throw new SupabaseError(
      'Supabase URL and anon key are required',
      'config_error',
      { details: 'Provide url and anonKey in the configuration object' }
    )
  }

  clientInstance = createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: config.options?.auth?.autoRefreshToken ?? true,
      persistSession: config.options?.auth?.persistSession ?? true,
      detectSessionInUrl: config.options?.auth?.detectSessionInUrl ?? true,
      storage: config.options?.auth?.storage as any,
      storageKey: config.options?.auth?.storageKey ?? 'sb-auth-token',
    },
    global: config.options?.global,
    db: config.options?.db as any,
  })

  return clientInstance
}

export function initializeSupabase(config?: SupabaseConfig): SupabaseClient {
  if (clientInstance) return clientInstance

  if (config) {
    return createSupabaseClient(config)
  }

  const url = resolveEnvValue('VITE_SUPABASE_URL') ?? resolveEnvValue('SUPABASE_URL')
  const anonKey = resolveEnvValue('VITE_SUPABASE_ANON_KEY') ?? resolveEnvValue('SUPABASE_ANON_KEY')

  if (!url || !anonKey) {
    throw new SupabaseError(
      'No Supabase configuration found',
      'config_error',
      { details: 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables, or call createSupabaseClient() explicitly' }
    )
  }

  return createSupabaseClient({ url, anonKey })
}

export function getSupabaseClient(): SupabaseClient {
  if (!clientInstance) {
    return initializeSupabase()
  }
  return clientInstance
}

export function isSupabaseInitialized(): boolean {
  return clientInstance !== null
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = getSupabaseClient()
    return (client as unknown as Record<string | symbol, unknown>)[prop]
  },
})
