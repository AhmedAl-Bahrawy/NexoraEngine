---
name: error-handling
description: Unified error format with safe error exposure, debug-friendly structure, and specialized error types for each SDK layer. Ensures consistent error handling.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  sdk_layer: errors
  complexity: low
  stability: stable
---

# Error Handling System

## Overview

Unified error format with safe error exposure, debug-friendly structure, and specialized error types for each SDK layer.

## What It Does

Provides a hierarchy of error classes (NexoraError base + specialized types) that normalize errors across the SDK with consistent codes, status codes, and structured details.

## Why Use It

Ensures consistent error handling, makes debugging easier with structured error objects, and allows consumers to handle specific error types appropriately.

## Inputs

```typescript
// NexoraError constructor
{
  message: string
  code: string
  options?: {
    statusCode?: number
    details?: Record<string, unknown>
    cause?: Error
  }
}

// NexoraError.from()
unknownError: unknown
defaultCode?: string
```

## Outputs

```typescript
// NexoraError
{
  name: string        // e.g., 'NexoraError', 'AuthError'
  message: string
  code: string        // e.g., 'auth_error', 'database_error'
  statusCode?: number  // HTTP-style status codes
  details?: Record<string, unknown>
  timestamp: number
  cause?: Error
  toJSON(): Record<string, unknown>
}

// ValidationError adds:
{
  fieldErrors?: Record<string, string[]>
}
```

## Usage

### Steps

1. Import error classes from `nexora-engine`
2. Throw appropriate error type in your code
3. Catch and handle based on error type

### Code Examples

```typescript
import { NexoraError, AuthError, ValidationError, DatabaseError } from 'nexora-engine'

// Throwing errors
throw new AuthError('Invalid credentials', {
  details: { userId: '123' },
})

throw new ValidationError('Invalid input', {
  fieldErrors: { email: ['Invalid format'] },
})

throw new DatabaseError('Query failed', {
  details: { table: 'users', operation: 'fetchAll' },
  cause: originalError,
})

// Converting unknown errors
try {
  await someOperation()
} catch (error) {
  throw NexoraError.from(error, 'operation_error')
}

// Handling errors
try {
  await signInWithPassword(creds)
} catch (error) {
  if (error instanceof AuthError) {
    // Handle auth errors (401)
  } else if (error instanceof ValidationError) {
    // Handle validation errors (422)
    console.log(error.fieldErrors)
  } else if (error instanceof NexoraError) {
    // Handle generic SDK errors
    console.log(error.code, error.details)
  }
}

// toJSON() for API responses
const error = new NexoraError('Something went wrong', 'server_error', {
  statusCode: 500,
  details: { stack: process.env.NODE_ENV === 'development' ? error.stack : undefined },
})
res.status(error.statusCode ?? 500).json(error.toJSON())
```

## Internal Logic

### Flow

1. Constructor stores message, code, statusCode, details, timestamp, cause
2. `toJSON()` returns serialized version safe for API responses
3. `NexoraError.from()` converts unknown errors to NexoraError
4. Specialized classes (AuthError, DatabaseError, etc.) set appropriate status codes

### Error Hierarchy

```
NexoraError (base)
├── AuthError (401)
├── DatabaseError (400)
├── ValidationError (422)
├── CacheError
├── RateLimitError (429)
└── TimeoutError (408)
```

## Constraints

### Rules

- All errors extend `NexoraError`
- `code` should be snake_case string
- `statusCode` should follow HTTP conventions
- `toJSON()` excludes stack traces by default (safe for client)

### Anti-Patterns

- Don't expose raw Supabase errors directly
- Don't include sensitive data in `details`
- Don't use generic `Error` in SDK code

## Dependencies

### Internal SDK Modules

- None (base layer)

### External Libraries

- None (pure TypeScript)

## Code Mapping

```typescript
// SDK Classes
NexoraError     -> NexoraError class
AuthError       -> AuthError class
DatabaseError   -> DatabaseError class
ValidationError -> ValidationError class
CacheError      -> CacheError class
RateLimitError  -> RateLimitError class
TimeoutError    -> TimeoutError class
```

## When to Use

- Use `AuthError` for authentication failures
- Use `ValidationError` for input validation failures
- Use `DatabaseError` for Supabase/database errors
- Use `RateLimitError` for rate limiting
- Use `TimeoutError` for timeout scenarios
- Use `NexoraError.from()` to convert unknown errors

## When NOT to Use

- Don't use for business logic errors (create custom errors)
- Don't use as control flow (use proper conditionals)
- Don't throw generic `Error` in SDK code

## Reasoning Strategy

1. Identify error type (auth, validation, database, etc.)
2. Use appropriate specialized error class
3. Include relevant `details` for debugging
4. Set `cause` to original error for chaining
5. Handle errors by type in consuming code
