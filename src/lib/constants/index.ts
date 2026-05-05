export const ENV_KEYS = {
  SUPABASE_URL: 'VITE_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'VITE_SUPABASE_ANON_KEY',
  SUPABASE_SERVICE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
} as const

export const ERROR_CODES = {
  NETWORK: 'network_error',
  DATABASE: 'database_error',
  AUTH: 'auth_error',
  STORAGE: 'storage_error',
  VALIDATION: 'validation_error',
  NOT_FOUND: 'not_found',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
} as const

export * from './supabase'
