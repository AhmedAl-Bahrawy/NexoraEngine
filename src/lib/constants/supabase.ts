export const SUPABASE = {
  URL_KEY: 'VITE_SUPABASE_URL',
  ANON_KEY: 'VITE_SUPABASE_ANON_KEY',
  SERVICE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
} as const

export const AUTH = {
  SESSION_KEY: 'sb-auth-token',
  COOKIE_OPTIONS: {
    name: 'sb-auth-token',
    lifetime: 60 * 60 * 24 * 7,
    domain: '',
    path: '/',
    sameSite: 'lax',
    secure: true,
  },
  PASSWORD_MIN_LENGTH: 6,
  DEFAULT_REDIRECT: '/',
} as const

export const DATABASE = {
  DEFAULT_SCHEMA: 'public',
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },
  DEFAULT_TIMEOUT: 10000,
  DEFAULT_RETRIES: 2,
  RETRY_DELAY: 1000,
  MAX_QUERY_PARAMS: 50,
} as const

export const CACHE = {
  DEFAULT_TTL: 300000,
  MAX_SIZE: 100,
  CLEANUP_INTERVAL: 60000,
  KEY_SEPARATOR: ':',
} as const

export const REALTIME = {
  SUBSCRIBE_STATES: {
    SUBSCRIBED: 'SUBSCRIBED',
    CHANNEL_ERROR: 'CHANNEL_ERROR',
    TIMED_OUT: 'TIMED_OUT',
    CLOSED: 'CLOSED',
    CONNECTING: 'CONNECTING',
  },
  EVENTS: {
    INSERT: 'INSERT',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    ALL: '*',
  },
  PRESENCE_EVENTS: {
    SYNC: 'sync',
    JOIN: 'join',
    LEAVE: 'leave',
  },
  BROADCAST: {
    DEFAULT_EVENT: '*',
    TYPE: 'broadcast',
  },
  DEFAULT_TIMEOUT: 30000,
  RECONNECT_DELAY: 1000,
  MAX_RECONNECT_ATTEMPTS: 5,
} as const

export const STORAGE = {
  MAX_FILE_SIZE: 50 * 1024 * 1024,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  UPLOAD_CHUNK_SIZE: 6 * 1024 * 1024,
} as const

export const ERRORS = {
  NETWORK: 'network_error',
  DATABASE: 'database_error',
  AUTH: 'auth_error',
  VALIDATION: 'validation_error',
  NOT_FOUND: 'not_found',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  RATE_LIMIT: 'rate_limit',
  TIMEOUT: 'timeout_error',
  CONFIG: 'config_error',
} as const
