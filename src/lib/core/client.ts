import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NexoraError } from '../errors/nexora-error'
import type { User, Session } from '@supabase/supabase-js'

export type { User, Session, SupabaseClient }

export interface NexoraConfig {
  url: string
  anonKey: string
  serviceRoleKey?: string
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
let serviceClientInstance: SupabaseClient | null = null

function resolveEnvValue(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] as string | undefined
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

export function createNexoraClient(config: NexoraConfig): SupabaseClient {
  if (!config.url || !config.anonKey) {
    throw new NexoraError(
      'Supabase URL and anon key are required',
      'config_error',
      { details: { message: 'Provide url and anonKey in the configuration object' } }
    )
  }

  clientInstance = createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: config.options?.auth?.autoRefreshToken ?? true,
      persistSession: config.options?.auth?.persistSession ?? true,
      detectSessionInUrl: config.options?.auth?.detectSessionInUrl ?? true,
      storage: config.options?.auth?.storage as any,
      storageKey: config.options?.auth?.storageKey ?? 'nexora-auth-token',
    },
    global: config.options?.global,
    db: config.options?.db as any,
  })

  if (config.serviceRoleKey) {
    serviceClientInstance = createClient(config.url, config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: config.options?.global,
      db: config.options?.db as any,
    })
  }

  return clientInstance
}

export function getClient(): SupabaseClient {
  if (!clientInstance) {
    const url = resolveEnvValue('VITE_SUPABASE_URL') ?? resolveEnvValue('SUPABASE_URL')
    const anonKey = resolveEnvValue('VITE_SUPABASE_ANON_KEY') ?? resolveEnvValue('SUPABASE_ANON_KEY')

    if (!url || !anonKey) {
      throw new NexoraError(
        'No Supabase configuration found',
        'config_error',
        { details: { message: 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables, or call createNexoraClient() explicitly' } }
      )
    }

    return createNexoraClient({ url, anonKey })
  }
  return clientInstance
}

export function getServiceClient(): SupabaseClient | null {
  return serviceClientInstance
}

export function isInitialized(): boolean {
  return clientInstance !== null
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = getClient()
    return (client as unknown as Record<string | symbol, unknown>)[prop]
  },
})
