# Database System Reference

## Query Operations

### `fetchAll<T>(table: string, options?: QueryOptions): Promise<{ data: T[] | null; error: Error | null; count: number }>`
Fetches all records matching criteria.

### `fetchById<T>(table: string, id: string | number, options?): Promise<{ data: T | null; error: Error | null }>`
Fetches single record by ID.

### `fetchWhere<T>(table: string, filters: FilterCondition[], options?): Promise<{ data: T[] | null; error: Error | null; count: number }>`
Fetches records matching filters.

### `fetchPaginated<T>(table: string, options?: PaginatedQueryOptions): Promise<PaginatedResult<T>>`
Fetches paginated results.

### `search<T>(table: string, column: string, query: string, options?): Promise<{ data: T[] | null; error: Error | null; count: number }>`
ILIKE search on column.

### `fullTextSearch<T>(table: string, column: string, query: string, options?): Promise<{ data: T[] | null; error: Error | null; count: number }>`
PostgreSQL full-text search.

### `count(table: string, filters?: FilterCondition[]): Promise<number>`
Counts matching records.

### `exists(table: string, filters: FilterCondition[]): Promise<boolean>`
Checks if any record matches.

### `distinct<T>(table: string, columns: string, options?): Promise<{ data: T[] | null; error: Error | null; count: number }>`
Gets distinct values. Falls back to client-side dedup if PostgREST fails.

### `aggregate(table: string, options?): Promise<AggregateResult>`
Computes sum, avg, min, max on columns.

## Mutation Operations

### `insertOne<T>(table: string, data: Record<string, unknown>, options?): Promise<T>`
Inserts single record.

### `insertMany<T>(table: string, data: Record<string, unknown>[], options?): Promise<T[]>`
Inserts multiple records.

### `updateById<T>(table: string, id: string, data: Record<string, unknown>, options?): Promise<T>`
Updates record by ID.

### `updateWhere<T>(table: string, conditions: Record<string, unknown>, data: Record<string, unknown>, options?): Promise<T[]>`
Updates records matching conditions.

### `upsert<T>(table: string, data: Record<string, unknown>, options?): Promise<T>`
Inserts or updates.

### `deleteById(table: string, id: string, options?): Promise<void>`
Deletes record by ID.

### `deleteWhere(table: string, conditions: Record<string, unknown>, options?): Promise<number>`
Deletes records matching conditions.

### `deleteMany(table: string, ids: string[], options?): Promise<void>`
Deletes records by IDs.

### `softDelete<T>(table: string, id: string, options?): Promise<T>`
Sets deleted_at timestamp.

### `restore<T>(table: string, id: string, options?): Promise<T>`
Clears deleted_at.

### `bulkInsert<T>(table: string, items: Record<string, unknown>[], options?): Promise<T[]>`
Bulk insert.

### `bulkUpdate<T>(table: string, items: { id: string; data: Record<string, unknown> }[], options?): Promise<T[]>`
Bulk update.

## Realtime Subscriptions

### `subscribeToTable<T>(config: SubscriptionConfig, callbacks: SubscriptionCallbacks<T>): SubscriptionHandle`
Subscribes to table changes.

### `subscribeToTables<T>(configs: Array<{ config; callbacks }>): Array<SubscriptionHandle>`
Multiple subscriptions.

### `createBroadcastChannel(channelName: string)`
Creates broadcast channel.

### `createPresenceChannel(channelName: string)`
Creates presence channel.

### `unsubscribe(handle): Promise<void>`
Unsubscribes from channel.

### `unsubscribeAll(): Promise<void>`
Unsubscribes from all channels.

## Filter Operators

`eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `in`, `contains`, `containedBy`, `overlap`, `is`, `match`

## QueryOptions

```typescript
import { ZodSchema } from 'zod'

interface QueryOptions {
  select?: string
  filters?: FilterCondition[]
  orderBy?: { column: string; ascending?: boolean }[]
  limit?: number
  offset?: number
  range?: { from: number; to: number }
  headers?: Record<string, string>
  ttl?: number
  useCache?: boolean
  timeout?: number
  retries?: number
  retryDelay?: number
  validate?: ZodSchema        // Zod schema for input validation
}
```

## MutationOptions

```typescript
import { ZodSchema } from 'zod'

interface MutationOptions {
  select?: string
  timeout?: number
  retries?: number
  retryDelay?: number
  invalidateCache?: boolean
  validate?: ZodSchema        // Zod schema for input validation
}
```

## FilterCondition

```typescript
interface FilterCondition {
  column: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'contains' | 'containedBy' | 'overlap' | 'is' | 'match'
  value: unknown
}
```

## Retry and Timeout

All queries and mutations support:
- `timeout`: Milliseconds before abort (default: 10000)
- `retries`: Number of retry attempts (default: 2 for queries, 0 for mutations)
- `retryDelay`: Base delay between retries in ms (default: 1000)

Retry uses exponential backoff and only retries on transient errors (network, timeout, 5xx, 429).

## Validation with Zod

Query and mutation operations support Zod schema validation via the `validate` option:

```typescript
import { z, insertOne, fetchAll } from '@/lib'

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['admin', 'member']).optional(),
})

// Insert with validation
const user = await insertOne('users', { name: 'John', email: 'john@example.com' }, {
  validate: userSchema,
})

// Query with validation (validates filters against schema)
const results = await fetchAll('users', {
  filters: [{ column: 'status', operator: 'eq', value: 'active' }],
  validate: z.array(z.object({ column: z.string(), operator: z.string(), value: z.unknown() })),
})
```
