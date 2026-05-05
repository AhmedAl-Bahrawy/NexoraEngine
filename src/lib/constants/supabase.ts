export const ENV_KEYS = {
  SUPABASE_URL: 'VITE_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'VITE_SUPABASE_ANON_KEY',
} as const

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

  TIMEOUTS: {
    CONNECTION: 10000,
    SUBSCRIPTION: 5000,
  },
} as const

export const AUTH = {
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

  REFRESH_THRESHOLD_MS: 5 * 60 * 1000,

  STORAGE_KEY: 'sb-session',
} as const

export const DATABASE = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  DEFAULT_ORDER_COLUMN: 'created_at',
  DEFAULT_ORDER_DIRECTION: 'desc',

  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
} as const

export const STORAGE = {
  MAX_FILE_SIZE: 50 * 1024 * 1024,

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

export const ERROR_CODES = {
  AUTH: {
    INVALID_CREDENTIALS: 'invalid_credentials',
    EMAIL_NOT_CONFIRMED: 'email_not_confirmed',
    USER_NOT_FOUND: 'user_not_found',
    WEAK_PASSWORD: 'weak_password',
    RATE_LIMIT: 'rate_limit_exceeded',
  },

  DB: {
    NOT_FOUND: 'not_found',
    DUPLICATE: 'duplicate_entry',
    CONSTRAINT_VIOLATION: 'constraint_violation',
    PERMISSION_DENIED: 'permission_denied',
  },

  STORAGE: {
    FILE_TOO_LARGE: 'file_too_large',
    INVALID_TYPE: 'invalid_file_type',
    UPLOAD_FAILED: 'upload_failed',
    NOT_FOUND: 'file_not_found',
  },
} as const
