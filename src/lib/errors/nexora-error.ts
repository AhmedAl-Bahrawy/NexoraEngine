export class NexoraError extends Error {
  public readonly code: string
  public readonly statusCode?: number
  public readonly details?: Record<string, unknown>
  public readonly timestamp: number
  public readonly cause?: Error

  constructor(
    message: string,
    code: string,
    options?: {
      statusCode?: number
      details?: Record<string, unknown>
      cause?: Error
    }
  ) {
    super(message)
    this.name = 'NexoraError'
    this.code = code
    this.statusCode = options?.statusCode
    this.details = options?.details
    this.timestamp = Date.now()
    this.cause = options?.cause

    Object.setPrototypeOf(this, NexoraError.prototype)
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      cause: this.cause ? { message: this.cause.message, name: this.cause.name } : undefined,
    }
  }

  static from(error: unknown, defaultCode = 'unknown_error'): NexoraError {
    if (error instanceof NexoraError) return error

    if (error instanceof Error) {
      return new NexoraError(error.message, defaultCode, {
        cause: error,
        details: { originalName: error.name },
      })
    }

    return new NexoraError(String(error), defaultCode, {
      details: { originalValue: error },
    })
  }
}

export class AuthError extends NexoraError {
  constructor(message: string, options?: { details?: Record<string, unknown>; cause?: Error }) {
    super(message, 'auth_error', { ...options, statusCode: 401 })
    this.name = 'AuthError'
    Object.setPrototypeOf(this, AuthError.prototype)
  }
}

export class DatabaseError extends NexoraError {
  constructor(message: string, options?: { details?: Record<string, unknown>; cause?: Error }) {
    super(message, 'database_error', { ...options, statusCode: 400 })
    this.name = 'DatabaseError'
    Object.setPrototypeOf(this, DatabaseError.prototype)
  }
}

export class ValidationError extends NexoraError {
  public readonly fieldErrors?: Record<string, string[]>

  constructor(
    message: string,
    options?: {
      details?: Record<string, unknown>
      cause?: Error
      fieldErrors?: Record<string, string[]>
    }
  ) {
    super(message, 'validation_error', { ...options, statusCode: 422 })
    this.name = 'ValidationError'
    this.fieldErrors = options?.fieldErrors
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class CacheError extends NexoraError {
  constructor(message: string, options?: { details?: Record<string, unknown>; cause?: Error }) {
    super(message, 'cache_error', { ...options })
    this.name = 'CacheError'
    Object.setPrototypeOf(this, CacheError.prototype)
  }
}

export class RateLimitError extends NexoraError {
  constructor(message: string, options?: { details?: Record<string, unknown>; cause?: Error }) {
    super(message, 'rate_limit_error', { ...options, statusCode: 429 })
    this.name = 'RateLimitError'
    Object.setPrototypeOf(this, RateLimitError.prototype)
  }
}

export class TimeoutError extends NexoraError {
  constructor(message: string, options?: { details?: Record<string, unknown> }) {
    super(message, 'timeout_error', { ...options, statusCode: 408 })
    this.name = 'TimeoutError'
    Object.setPrototypeOf(this, TimeoutError.prototype)
  }
}

export class ForbiddenError extends NexoraError {
  constructor(message: string, options?: { details?: Record<string, unknown>; cause?: Error }) {
    super(message, 'forbidden_error', { ...options, statusCode: 403 })
    this.name = 'ForbiddenError'
    Object.setPrototypeOf(this, ForbiddenError.prototype)
  }
}

export class StorageError extends NexoraError {
  constructor(message: string, options?: { details?: Record<string, unknown>; cause?: Error }) {
    super(message, 'storage_error', { ...options })
    this.name = 'StorageError'
    Object.setPrototypeOf(this, StorageError.prototype)
  }
}
