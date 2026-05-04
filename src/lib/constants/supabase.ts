/**
 * Supabase Constants
 * Centralized configuration values for Supabase client
 */

// Environment variable keys
export const ENV_KEYS = {
  SUPABASE_URL: 'VITE_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'VITE_SUPABASE_ANON_KEY',
} as const

// Realtime constants
export const REALTIME = {
  LISTEN_TYPES: {
    POSTGRES_CHANGES: 'postgres_changes',
    BROADCAST: 'broadcast',
    PRESENCE: 'presence',
  } as const,
  
  SUBSCRIBE_STATES: {
    SUBSCRIBED: 'SUBSCRIBED',
    TIMED_OUT: 'TIMED_OUT',
    CLOSED: 'CLOSED',
    CHANNEL_ERROR: 'CHANNEL_ERROR',
  } as const,
  
  EVENTS: {
    INSERT: 'INSERT',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    ALL: '*',
  } as const,
  
  // Default timeouts in milliseconds
  TIMEOUTS: {
    CONNECTION: 10000,
    SUBSCRIPTION: 5000,
  },
} as const

// Auth constants
export const AUTH = {
  // OAuth providers
  OAUTH_PROVIDERS: [
    'google',
    'github',
    'gitlab',
    'azure',
    'bitbucket',
    'facebook',
    'twitter',
    'apple',
  ] as const,
  
  // Session refresh threshold (5 minutes before expiry)
  REFRESH_THRESHOLD_MS: 5 * 60 * 1000,
  
  // Storage keys
  STORAGE_KEY: 'sb-session',
} as const

// Database constants
export const DATABASE = {
  // Default pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Query defaults
  DEFAULT_ORDER_COLUMN: 'created_at',
  DEFAULT_ORDER_DIRECTION: 'desc',
  
  // Retry config
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
} as const

// Storage constants
export const STORAGE = {
  // Default buckets
  BUCKETS: {
    AVATARS: 'avatars',
    IMAGES: 'images',
    DOCUMENTS: 'documents',
    PUBLIC: 'public',
  } as const,
  
  // File size limits (in bytes)
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  
  // Allowed mime types
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ] as const,
  
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ] as const,
} as const

// Error codes
export const ERROR_CODES = {
  // Auth errors
  AUTH: {
    INVALID_CREDENTIALS: 'invalid_credentials',
    EMAIL_NOT_CONFIRMED: 'email_not_confirmed',
    USER_NOT_FOUND: 'user_not_found',
    WEAK_PASSWORD: 'weak_password',
    RATE_LIMIT: 'rate_limit_exceeded',
  },
  
  // Database errors
  DB: {
    NOT_FOUND: 'not_found',
    DUPLICATE: 'duplicate_entry',
    CONSTRAINT_VIOLATION: 'constraint_violation',
    PERMISSION_DENIED: 'permission_denied',
  },
  
  // Storage errors
  STORAGE: {
    FILE_TOO_LARGE: 'file_too_large',
    INVALID_TYPE: 'invalid_file_type',
    UPLOAD_FAILED: 'upload_failed',
    NOT_FOUND: 'file_not_found',
  },
} as const
