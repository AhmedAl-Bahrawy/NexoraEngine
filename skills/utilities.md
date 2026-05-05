# Utilities Reference

## Error Handling

### `handleSupabaseError(error: unknown): SupabaseError`
Normalizes any error into typed SupabaseError.

### `logError(error: unknown, context?: string): void`
Logs error with context.

### Error Classes
- `SupabaseError` - Base class with code, details, hint, statusCode
- `AuthError` - Authentication failures
- `DatabaseError` - Query failures
- `StorageError` - File operation failures
- `ValidationError` - Input validation failures (includes fieldErrors)
- `ForbiddenError` - Authorization failures
- `RateLimitError` - Rate limit exceeded (includes resetAt)

### Type Guards
- `isAuthErrorType(error)`, `isDatabaseErrorType(error)`, `isStorageErrorType(error)`, `isValidationErrorType(error)`

## Retry Logic

### `withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>`
Retries function with backoff strategy.

### `withTimeout<T>(promise: Promise<T>, timeoutMs: number, message?: string): Promise<T>`
Wraps promise with timeout.

### RetryOptions

```typescript
interface RetryOptions {
  retries?: number              // Default: 2
  delay?: number                // Default: 1000ms
  backoff?: 'linear' | 'exponential' | 'fixed'  // Default: exponential
  shouldRetry?: (error: Error, attempt: number) => boolean
}
```

### Retryable Errors
Network errors, timeouts, ECONNRESET, ECONNREFUSED, EAI_AGAIN, rate limits (429), server errors (500-504).

## Validation (Zod-based)

Uses [Zod](https://zod.dev/) (v4) for TypeScript-first schema validation.

### `z` (Zod namespace)
Import the Zod namespace to create schemas: `import { z } from '@/lib'`

### `validateInput<T>(data: unknown, schema: ZodSchema<T>): ValidationResult`
Validates data against a Zod schema. Returns `{ valid, errors, data }`.

### `validateOrFail<T>(data: unknown, schema: ZodSchema<T>): T`
Validates data against a Zod schema. Returns parsed data or throws ValidationError.

### `createValidator<T>(schema: ZodSchema<T>): Validator`
Creates a reusable validator with parse, safeParse, validate, and validateOrFail methods.

### Basic Schema Examples

```typescript
import { z, validateInput, validateOrFail } from '@/lib'

const userSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150).optional(),
  role: z.enum(['admin', 'member', 'guest']).default('member'),
})

// Safe validation
const result = validateInput(input, userSchema)
if (!result.valid) {
  console.log(result.errors) // ["name: Too small: expected string to have >=2 characters"]
}

// Strict validation (throws on failure)
const user = validateOrFail(input, userSchema)
```

### Reusable Validator Pattern

```typescript
import { z, createValidator } from '@/lib'

const userValidator = createValidator(z.object({
  name: z.string().min(2),
  email: z.string().email(),
}))

// Parse (throws on failure)
const user = userValidator.parse(input)

// Safe parse
const result = userValidator.safeParse(input)

// Validate (returns { valid, errors })
const status = userValidator.validate(input)
```

### Zod Schema Types
- `z.string()`, `z.number()`, `z.boolean()`, `z.bigint()`
- `z.object({ ... })`, `z.array(z.string())`
- `z.enum(['a', 'b', 'c'])`, `z.union([z.string(), z.number()])`
- `z.optional()`, `z.nullable()`, `z.default()`
- `z.string().email()`, `z.string().url()`, `z.string().uuid()`
- `z.string().min(n)`, `z.string().max(n)`, `z.number().int()`, `z.number().positive()`
- `z.preprocess(fn, schema)` for data transformation before validation

## Rate Limiting

### `createRateLimiter(config: RateLimitConfig): RateLimiter`
Creates rate limiter instance.

### `rateLimit(identifier: string, config?): Promise<{ allowed: boolean; remaining: number; resetAt: number }>`
Quick rate limit check using default limiter.

### RateLimiter Methods
- `check(identifier)`: Returns status without consuming
- `consume(identifier)`: Consumes a slot, throws if exceeded
- `reset(identifier?)`: Clears limit
- `getStats()`: Returns { activeKeys, totalRequests }
- `dispose()`: Cleans up interval

### RateLimitConfig

```typescript
interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  message?: string
  keyGenerator?: (identifier: string) => string
}
```

## File Validators

### `validatePassword(password: string): { isValid: boolean; errors: string[] }`
Min 6 chars, requires uppercase, lowercase, number.

### `isValidEmail(email: string): boolean`
Basic email format validation.
