/**
 * Error Handling Utilities
 * Centralized error handling for Supabase operations
 */

import { ERROR_CODES } from '../constants/supabase'

// Custom error classes
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
    super(message, 'validation_error')
    this.name = 'ValidationError'
    this.fieldErrors = fieldErrors
  }
}

// Main error handler
export function handleSupabaseError(error: unknown): SupabaseError {
  // Handle SupabaseError instances
  if (error instanceof SupabaseError) {
    return error
  }
  
  // Handle standard Error instances
  if (error instanceof Error) {
    return new SupabaseError(
      error.message,
      ERROR_CODES.DB.NOT_FOUND,
      { details: error.stack }
    )
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return new SupabaseError(error, ERROR_CODES.DB.NOT_FOUND)
  }
  
  // Handle Supabase postgrest errors
  if (isPostgrestError(error)) {
    return new DatabaseError(
      error.message,
      error.code,
      { details: error.details, hint: error.hint }
    )
  }
  
  // Handle Supabase auth errors
  if (isAuthError(error)) {
    return new AuthError(
      error.message,
      mapAuthErrorCode(error.status),
      { details: error.message }
    )
  }
  
  // Handle Supabase storage errors
  if (isStorageError(error)) {
    return new StorageError(
      error.message,
      mapStorageErrorCode(error.statusCode),
      { statusCode: error.statusCode, details: `Status: ${error.statusCode}` }
    )
  }
  
  // Unknown error
  return new SupabaseError(
    'An unknown error occurred',
    'unknown_error',
    { details: JSON.stringify(error) }
  )
}

// Type guards
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

// Error code mappers
function mapAuthErrorCode(status: number): string {
  const codeMap: Record<number, string> = {
    400: ERROR_CODES.AUTH.INVALID_CREDENTIALS,
    401: ERROR_CODES.AUTH.INVALID_CREDENTIALS,
    403: ERROR_CODES.AUTH.EMAIL_NOT_CONFIRMED,
    404: ERROR_CODES.AUTH.USER_NOT_FOUND,
    422: ERROR_CODES.AUTH.WEAK_PASSWORD,
    429: ERROR_CODES.AUTH.RATE_LIMIT,
  }
  return codeMap[status] || 'auth_error'
}

function mapStorageErrorCode(statusCode: number): string {
  const codeMap: Record<number, string> = {
    400: ERROR_CODES.STORAGE.INVALID_TYPE,
    404: ERROR_CODES.STORAGE.NOT_FOUND,
    413: ERROR_CODES.STORAGE.FILE_TOO_LARGE,
  }
  return codeMap[statusCode] || ERROR_CODES.STORAGE.UPLOAD_FAILED
}

// Error logging utility
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

// Check if error is of specific type
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

// Error recovery suggestions
export function getErrorSuggestion(error: SupabaseError): string {
  const suggestions: Record<string, string> = {
    [ERROR_CODES.AUTH.INVALID_CREDENTIALS]: 'Check your email and password and try again.',
    [ERROR_CODES.AUTH.EMAIL_NOT_CONFIRMED]: 'Please check your email and confirm your account.',
    [ERROR_CODES.AUTH.USER_NOT_FOUND]: 'No account found with this email. Please sign up.',
    [ERROR_CODES.AUTH.WEAK_PASSWORD]: 'Use a stronger password with at least 8 characters.',
    [ERROR_CODES.AUTH.RATE_LIMIT]: 'Too many attempts. Please wait a moment and try again.',
    [ERROR_CODES.DB.NOT_FOUND]: 'The requested resource was not found.',
    [ERROR_CODES.DB.DUPLICATE]: 'This record already exists.',
    [ERROR_CODES.DB.PERMISSION_DENIED]: 'You do not have permission to perform this action.',
    [ERROR_CODES.STORAGE.FILE_TOO_LARGE]: 'The file is too large. Maximum size is 50MB.',
    [ERROR_CODES.STORAGE.INVALID_TYPE]: 'This file type is not supported.',
    'validation_error': 'Please check your input and try again.',
  }
  
  return suggestions[error.code] || 'An error occurred. Please try again.'
}

// Format error for display
export function formatErrorForDisplay(error: unknown): { 
  title: string
  message: string
  suggestion: string
  code: string
} {
  const supabaseError = handleSupabaseError(error)
  
  return {
    title: supabaseError.name.replace(/([A-Z])/g, ' $1').trim(),
    message: supabaseError.message,
    suggestion: getErrorSuggestion(supabaseError),
    code: supabaseError.code,
  }
}
