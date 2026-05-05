# Error Handling

The template provides a centralized, typed error handling system for all Supabase operations.

## Error Classes

All errors extend from a base `SupabaseError` class:

### SupabaseError

The base error class for all Supabase-related errors.

```typescript
class SupabaseError extends Error {
  code: string
  details?: string
  hint?: string
  statusCode?: number
}
```

### AuthError

Authentication-specific errors.

```typescript
import { AuthError } from '@/lib'

try {
  await signInWithPassword({ email, password })
} catch (error) {
  if (error instanceof AuthError) {
    // Handle auth-specific error
    console.log(error.code)  // 'invalid_credentials', 'email_not_confirmed', etc.
  }
}
```

### DatabaseError

Database operation errors (PostgREST errors).

```typescript
import { DatabaseError } from '@/lib'

try {
  await insertOne('users', data)
} catch (error) {
  if (error instanceof DatabaseError) {
    console.log(error.code)  // 'not_found', 'duplicate_entry', etc.
    console.log(error.hint)  // Postgres hint if available
  }
}
```

### StorageError

File storage operation errors.

```typescript
import { StorageError } from '@/lib'

try {
  await uploadFile('bucket', path, file)
} catch (error) {
  if (error instanceof StorageError) {
    console.log(error.statusCode)  // HTTP status code
  }
}
```

### ValidationError

Input validation errors with per-field error details.

```typescript
import { ValidationError } from '@/lib'

try {
  await signUp({ email: 'invalid', password: 'weak' })
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(error.fieldErrors)
    // { email: ['Please enter a valid email address'] }
  }
}
```

## Error Handler

The `handleSupabaseError` function normalizes all error types into a consistent format:

```typescript
import { handleSupabaseError } from '@/lib'

try {
  // Any Supabase operation
} catch (error) {
  const normalized = handleSupabaseError(error)
  // Always returns a SupabaseError subclass
}
```

### What It Handles

| Input Type | Output |
|------------|--------|
| `SupabaseError` | Returns as-is |
| PostgREST error | `DatabaseError` |
| Auth error | `AuthError` |
| Storage error | `StorageError` |
| Generic `Error` | `SupabaseError` |
| String | `SupabaseError` |
| Unknown | `SupabaseError` with JSON details |

## Type Guards

Check error types at runtime:

```typescript
import { isAuthErrorType, isDatabaseErrorType, isStorageErrorType, isValidationErrorType } from '@/lib'

catch (error) {
  if (isAuthErrorType(error)) {
    // Redirect to login
  }
  if (isDatabaseErrorType(error)) {
    // Show database error UI
  }
  if (isStorageErrorType(error)) {
    // Handle storage error
  }
  if (isValidationErrorType(error)) {
    // Show field-level errors
  }
}
```

## Error Logging

Use `logError` for consistent, structured logging:

```typescript
import { logError } from '@/lib'

try {
  await someOperation()
} catch (error) {
  logError(error, 'UserService.create')
  // Logs: [Supabase Error] { context, name, message, code, details, hint, statusCode, timestamp }
}
```

## Error Suggestions

Get user-friendly recovery suggestions:

```typescript
import { getErrorSuggestion, formatErrorForDisplay } from '@/lib'

catch (error) {
  const suggestion = getErrorSuggestion(handleSupabaseError(error))
  // "Check your email and password and try again."

  const display = formatErrorForDisplay(error)
  // { title: 'Auth Error', message: '...', suggestion: '...', code: '...' }
}
```

## Error Codes

### Auth Error Codes

| Code | Meaning |
|------|---------|
| `invalid_credentials` | Wrong email or password |
| `email_not_confirmed` | Email verification required |
| `user_not_found` | No account with this email |
| `weak_password` | Password does not meet requirements |
| `rate_limit_exceeded` | Too many attempts |

### Database Error Codes

| Code | Meaning |
|------|---------|
| `not_found` | Resource does not exist |
| `duplicate_entry` | Unique constraint violation |
| `constraint_violation` | Foreign key or other constraint |
| `permission_denied` | RLS or permission error |

### Storage Error Codes

| Code | Meaning |
|------|---------|
| `file_too_large` | Exceeds size limit |
| `invalid_file_type` | MIME type not allowed |
| `upload_failed` | Upload operation failed |
| `file_not_found` | File does not exist |

## Best Practices

1. **Always catch and normalize** - Use `handleSupabaseError` in catch blocks
2. **Use typed errors** - Check with type guards for specific handling
3. **Log with context** - Include operation name in `logError`
4. **Show user-friendly messages** - Use `formatErrorForDisplay` for UI
5. **Don't leak sensitive data** - Error details are sanitized
