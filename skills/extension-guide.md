# Extension Guide

## Adding New Query Operations

1. Add function to `src/lib/database/queries.ts`
2. Follow pattern: build query → apply filters/sort → execute with retry → cache if applicable
3. Export from `src/lib/database/index.ts`
4. Re-export from `src/lib/index.ts`

Example:
```typescript
export async function customQuery<T extends GenericRow>(
  table: string,
  options?: QueryOptions
): Promise<{ data: T[] | null; error: Error | null; count: number }> {
  const supabase = getSupabaseClient()
  let query = supabase.from(table).select(options?.select ?? '*')
  // Apply filters, sorting, pagination
  return executeQuery<T>(query, { timeout: options?.timeout, retries: options?.retries })
}
```

## Adding New Mutation Operations

1. Add function to `src/lib/database/mutations.ts`
2. Follow pattern: validate → execute → invalidate cache → return
3. Export from `src/lib/database/index.ts`

## Adding Validation Rules

Use Zod schemas with `validateInput()` or `validateOrFail()`:

```typescript
import { z, validateOrFail, validateInput } from '@/lib'

const schema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
  name: z.string().min(2).max(100),
  status: z.enum(['active', 'inactive']),
})

// Safe validation
const result = validateInput(data, schema)
if (!result.valid) console.log(result.errors)

// Strict validation (throws on failure)
validateOrFail(data, schema)
```

Create reusable validators:

```typescript
import { z, createValidator } from '@/lib'

const userValidator = createValidator(z.object({
  email: z.string().email(),
  name: z.string().min(2),
}))

const user = userValidator.parse(input)  // throws on failure
const result = userValidator.safeParse(input)  // returns { success, data/error }
```

## Adding Auth Middleware

Use `enforceAuth()` or wrapper functions:

```typescript
const ctx = await enforceAuth({ requireRole: 'admin' })
// or
const result = await withAuth(async (ctx) => {
  // ctx.user, ctx.userId, ctx.email, ctx.role available
}, { requireRole: 'admin' })
```

## Adding Rate Limiting

```typescript
import { rateLimit, createRateLimiter } from './lib/utils/rate-limit'

// Quick check with defaults
await rateLimit(userId)

// Custom limiter
const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 10 })
await limiter.consume(userId)
```

## Adding Custom Error Types

Extend SupabaseError:

```typescript
export class CustomError extends SupabaseError {
  constructor(message: string, options?: { details?: string }) {
    super(message, 'custom_error', options)
    this.name = 'CustomError'
  }
}
```

## Query Engine Usage

The QueryEngine provides a higher-level abstraction with caching and deduplication:

```typescript
import { queryEngine } from './lib'

const results = await queryEngine.query({ table: 'users', filters: [{ column: 'active', operator: 'eq', value: true }] })
const single = await queryEngine.querySingle('users', [{ column: 'id', operator: 'eq', value: '123' }])
const paginated = await queryEngine.queryPaginated({ table: 'users', page: 1, pageSize: 20 })
const count = await queryEngine.queryCount('users')

// Fluent builder
const query = queryEngine.createQuery('users')
  .where('active', 'eq', true)
  .orderBy('created_at', { ascending: false })
  .limit(10)
const results = await query.execute()
```

## Adding New Storage Operations

1. Add function to `src/lib/storage/index.ts`
2. Use `withStorageRetry()` wrapper for retry logic
3. Export from index

## Configuration

Set environment variables:
- `VITE_SUPABASE_URL` - Project URL
- `VITE_SUPABASE_ANON_KEY` - Public API key
- `SUPABASE_SERVICE_ROLE_KEY` - Admin key (server only)
