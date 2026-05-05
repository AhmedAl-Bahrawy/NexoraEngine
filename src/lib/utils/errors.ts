import { ERRORS } from '../constants/supabase'

export class SupabaseError extends Error {
  code: string
  details?: string
  hint?: string
  statusCode?: number

  constructor(message: string, code: string, options?: {
    details?: string
    hint?: string
    statusCode?: number
  }) {
    super(message)
    this.name = 'SupabaseError'
    this.code = code
    this.details = options?.details
    this.hint = options?.hint
    this.statusCode = options?.statusCode
  }
}

export class AuthError extends SupabaseError {
  constructor(message: string, code: string, options?: { details?: string; hint?: string }) {
    super(message, code, options)
    this.name = 'AuthError'
  }
}

export class DatabaseError extends SupabaseError {
  constructor(message: string, code: string, options?: { details?: string; hint?: string }) {
    super(message, code, options)
    this.name = 'DatabaseError'
  }
}

export class StorageError extends SupabaseError {
  constructor(message: string, code: string, options?: { details?: string; hint?: string; statusCode?: number }) {
    super(message, code, options)
    this.name = 'StorageError'
  }
}

export class ValidationError extends SupabaseError {
  fieldErrors: Record<string, string[]>

  constructor(message: string, fieldErrors: Record<string, string[]>) {
    super(message, ERRORS.VALIDATION)
    this.name = 'ValidationError'
    this.fieldErrors = fieldErrors
  }
}

export class ForbiddenError extends SupabaseError {
  constructor(message: string, options?: { details?: string }) {
    super(message, ERRORS.FORBIDDEN, options)
    this.name = 'ForbiddenError'
  }
}

export class RateLimitError extends SupabaseError {
  resetAt: number

  constructor(message: string, resetAt: number) {
    super(message, ERRORS.RATE_LIMIT)
    this.name = 'RateLimitError'
    this.resetAt = resetAt
  }
}

export function handleSupabaseError(error: unknown): SupabaseError {
  if (error instanceof SupabaseError) {
    return error
  }

  if (error instanceof Error) {
    return new SupabaseError(
      error.message,
      ERRORS.DATABASE,
      { details: error.stack }
    )
  }

  if (typeof error === 'string') {
    return new SupabaseError(error, ERRORS.DATABASE)
  }

  if (isPostgrestError(error)) {
    return new DatabaseError(
      error.message,
      error.code,
      { details: error.details, hint: error.hint }
    )
  }

  if (isAuthError(error)) {
    return new AuthError(
      error.message,
      mapAuthErrorCode(error.status),
      { details: error.message }
    )
  }

  if (isStorageError(error)) {
    return new StorageError(
      error.message,
      mapStorageErrorCode(error.statusCode),
      { statusCode: error.statusCode, details: `Status: ${error.statusCode}` }
    )
  }

  return new SupabaseError(
    'An unknown error occurred',
    ERRORS.CONFIG,
    { details: JSON.stringify(error) }
  )
}

function isPostgrestError(error: unknown): error is {
  message: string
  code: string
  details: string
  hint: string
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error
  )
}

function isAuthError(error: unknown): error is {
  message: string
  status: number
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'status' in error
  )
}

function isStorageError(error: unknown): error is {
  message: string
  statusCode: number
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'statusCode' in error
  )
}

function mapAuthErrorCode(status: number): string {
  const codeMap: Record<number, string> = {
    400: ERRORS.AUTH,
    401: ERRORS.UNAUTHORIZED,
    403: ERRORS.FORBIDDEN,
    404: ERRORS.NOT_FOUND,
    429: ERRORS.RATE_LIMIT,
  }
  return codeMap[status] ?? ERRORS.AUTH
}

function mapStorageErrorCode(statusCode: number): string {
  const codeMap: Record<number, string> = {
    400: ERRORS.VALIDATION,
    404: ERRORS.NOT_FOUND,
    413: ERRORS.VALIDATION,
  }
  return codeMap[statusCode] ?? ERRORS.DATABASE
}

export function logError(error: unknown, context?: string): void {
  const supabaseError = handleSupabaseError(error)

  console.error('[Supabase Error]', {
    context,
    name: supabaseError.name,
    message: supabaseError.message,
    code: supabaseError.code,
    details: supabaseError.details,
    hint: supabaseError.hint,
    statusCode: supabaseError.statusCode,
    timestamp: new Date().toISOString(),
  })
}

export function isAuthErrorType(error: unknown): error is AuthError {
  return error instanceof AuthError
}

export function isDatabaseErrorType(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError
}

export function isStorageErrorType(error: unknown): error is StorageError {
  return error instanceof StorageError
}

export function isValidationErrorType(error: unknown): error is ValidationError {
  return error instanceof ValidationError
}
