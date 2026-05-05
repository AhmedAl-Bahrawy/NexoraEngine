# Skill: Query Engine

## id
`nexora.query-engine`

## name
Query Engine

## category
query

## description
Nexora Engine's smart query system with automatic caching, deduplication, and TTL-based expiration.

## intent
### what
Provides a high-level cached query layer on top of Supabase's native query capabilities. Supports automatic request deduplication, TTL-based caching, and cache invalidation on mutations.

### why
Reduces redundant database calls, improves response times, and provides a clean API for building complex queries without manual cache management.

## inputs
```typescript
interface CachedQueryOptions {
  table: string
  columns?: string
  filters?: Filter[]
  sort?: SortConfig[]
  pagination?: PaginationConfig
  ttl?: number          // milliseconds
  bypassCache?: boolean
  timeout?: number
  retries?: number
}
```

## outputs
```typescript
// query()
T[]

// querySingle()
T | null

// queryPaginated()
interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// queryPaginatedCursor() - NEW
interface CursorPaginatedResponse<T> {
  data: T[]
  hasMore: boolean
  nextCursor: string | null
  totalCount: number
}

// createInfiniteScroll() - NEW
InfiniteScrollManager<T>

// queryCount()
number

// optimisticUpdate() - NEW
Promise<{ rollback: () => void }>
```

## usage
### steps
1. Import `queryEngine` from `nexora-engine`
2. Call `queryEngine.query()` with table name and options
3. Results are automatically cached based on query parameters
4. Use `queryEngine.invalidateTable()` to manually clear cache

### code examples
```typescript
import { queryEngine } from 'nexora-engine'

// Basic cached query
const users = await queryEngine.query<User>({
  table: 'users',
  filters: [{ column: 'status', operator: 'eq', value: 'active' }],
  ttl: 60_000, // 1 minute
})

// Paginated query
const result = await queryEngine.queryPaginated<User>({
  table: 'users',
  page: 1,
  pageSize: 20,
  sort: [{ column: 'created_at', ascending: false }],
})

// Single record
const user = await queryEngine.querySingle<User>('users', [
  { column: 'email', operator: 'eq', value: 'user@example.com' },
])

// Count
const count = await queryEngine.queryCount('users', [
  { column: 'status', operator: 'eq', value: 'active' },
])

// Mutations auto-invalidate cache
await queryEngine.create<User>('users', { name: 'John' })
await queryEngine.update<User>('users', 'user-id', { name: 'Jane' })
await queryEngine.remove('users', 'user-id')
```

## logic
### internal flow
1. Check cache for existing result using derived cache key
2. If cached and not expired, return cached data
3. If concurrent query exists, deduplicate by returning existing promise
4. Execute query against Supabase
5. Store result in cache with TTL
6. For mutations: invalidate related cache entries automatically

### execution reasoning
- Cache key derived from: table + operation + filters + sort + pagination + columns
- Deduplication prevents multiple identical in-flight requests
- Mutations call `invalidateTable()` which clears all cache keys matching the table pattern

## constraints
### rules
- TTL is in milliseconds
- `bypassCache: true` skips cache read but still writes on successful response
- Pagination uses `limit` and `offset` internally
- Filters use Supabase filter operators (eq, neq, gt, gte, lt, lte, like, ilike, in, is, contains, containedBy, overlap, match, not)
- `PaginatedResponse` includes `hasNextPage` and `hasPreviousPage` booleans
- Use `queryPaginatedCursor()` for cursor-based pagination with large datasets
- Use `createInfiniteScroll()` for automatic infinite scroll state management
- Use `optimisticUpdate()` for immediate UI feedback with automatic rollback

### anti-patterns
- Don't use `queryEngine` for real-time data that changes rapidly (use direct `fetchAll` or subscriptions)
- Don't set very long TTLs for data that changes frequently
- Don't call `invalidateTable()` in rapid succession (batch mutations instead)

## dependencies
### internal SDK modules
- `QueryCache` (from `./cache/cache`)
- `deriveCacheKey`, `deriveMutationKeys` (from `./cache/keys`)
- `fetchAll`, `fetchById`, `fetchWhere`, `fetchPaginated`, `count` (from `./database/queries`)

### external libraries
- `@supabase/supabase-js`

## code_mapping
```typescript
// SDK Functions
queryEngine.query()              -> QueryEngine.query()
queryEngine.querySingle()        -> QueryEngine.querySingle()
queryEngine.queryPaginated()     -> QueryEngine.queryPaginated()
queryEngine.queryPaginatedCursor() -> QueryEngine.queryPaginatedCursor()
queryEngine.queryCount()         -> QueryEngine.queryCount()
queryEngine.createInfiniteScroll() -> QueryEngine.createInfiniteScroll()
queryEngine.optimisticUpdate()   -> QueryEngine.optimisticUpdate()
queryEngine.create()             -> QueryEngine.create()
queryEngine.createMany()         -> QueryEngine.createMany()
queryEngine.update()             -> QueryEngine.update()
queryEngine.updateWhere()        -> QueryEngine.updateWhere()
queryEngine.upsert()             -> QueryEngine.upsert()
queryEngine.remove()             -> QueryEngine.remove()
queryEngine.removeWhere()        -> QueryEngine.removeWhere()
queryEngine.invalidateTable()    -> QueryEngine.invalidateTable()
queryEngine.invalidateAll()      -> QueryEngine.invalidateAll()
queryEngine.getCacheStats()      -> QueryEngine.getCacheStats()
```

## ai_instructions
### when to use
- Use `queryEngine` for most read operations that can benefit from caching
- Use for list/detail views in UI applications
- Use for API endpoints that serve relatively static data
- Use `queryPaginatedCursor()` or `createInfiniteScroll()` for large datasets (>1000 rows)
- Use `optimisticUpdate()` for non-critical UI interactions that need immediate feedback

### when NOT to use
- Don't use for real-time data (use subscriptions instead)
- Don't use for mutations directly (use the mutation methods on queryEngine)
- Don't use when you need absolute freshness (use `bypassCache: true`)

### reasoning strategy
1. Determine if data can be cached (is it relatively static?)
2. Choose appropriate TTL based on data volatility
3. Use `queryEngine.query()` for lists, `querySingle()` for single records
4. For mutations, use the built-in mutation methods to auto-invalidate
5. For manual cache control, use `invalidateTable()` or `invalidateAll()`

## metadata
- complexity: medium
- stability: stable
- sdk_layer: query_engine
