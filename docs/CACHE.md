# Caching System

The template includes a built-in, framework-agnostic caching layer for query results.

## Overview

The cache sits between your application code and the database, storing query results with configurable time-to-live (TTL). It automatically deduplicates concurrent identical queries and provides multiple invalidation strategies.

## QueryCache

```typescript
import { QueryCache } from '@/lib/cache'

const cache = new QueryCache({
  defaultTTL: 5 * 60 * 1000,  // 5 minutes
  maxEntries: 500,             // Max cached items
})
```

### Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `defaultTTL` | 300,000 (5 min) | Default time-to-live in milliseconds |
| `maxEntries` | 500 | Maximum number of cached entries |

### Methods

#### `get<T>(key: string): T | null`

Retrieve a cached value. Returns `null` if not found or expired.

```typescript
const users = cache.get<User[]>('users:active')
```

#### `set<T>(key: string, data: T, ttl?: number): void`

Store a value with optional custom TTL.

```typescript
cache.set('users:active', users, 60_000) // 1 minute
cache.set('config', config)              // Uses default TTL
```

#### `invalidate(key: string): boolean`

Remove a specific cache entry. Returns `true` if the key existed.

```typescript
cache.invalidate('users:active')
```

#### `invalidatePattern(pattern: string | RegExp): number`

Remove all entries matching a pattern. Returns count of removed entries.

```typescript
// Remove all user-related cache
cache.invalidatePattern('users:')

// Remove with regex
cache.invalidatePattern(/^users:/)
```

#### `invalidateAll(): void`

Clear all cached entries.

```typescript
cache.invalidateAll()
```

#### `has(key: string): boolean`

Check if a key exists and is not expired.

```typescript
if (cache.has('users:active')) {
  // Cache is valid
}
```

#### `getStats(): CacheStats`

Get cache performance statistics.

```typescript
const stats = cache.getStats()
// { size: 42, hits: 1200, misses: 80, hitRate: 0.937 }
```

#### `keys(): string[]`

Get all valid (non-expired) cache keys.

```typescript
const keys = cache.keys()
// ['users:active', 'products:list', ...]
```

## Cache Key Derivation

Cache keys are derived from query parameters to ensure consistency:

```typescript
import { deriveCacheKey, deriveTableKey, deriveMutationKeys } from '@/lib/cache'

// Derive key from query components
const key = deriveCacheKey({
  table: 'users',
  operation: 'query',
  filters: { status: 'active' },
  sort: { column: 'created_at', ascending: false },
  pagination: { limit: 20, offset: 0 },
  columns: 'id, name, email',
})
// -> "qb:users:query|cols:id, name, email|filters:{status:active}|order:created_at:desc|page:20:0"

// Simple table key
const tableKey = deriveTableKey('users', 'user-123')
// -> "qb:users:user-123"

// Mutation invalidation keys
const patterns = deriveMutationKeys('users')
// -> ["qb:users:", "qb:users:all"]
```

## Key Components

| Component | Description |
|-----------|-------------|
| `table` | Target table name |
| `operation` | Operation type (query, single, count, paginated) |
| `filters` | Filter conditions as an object |
| `sort` | Sort configuration |
| `pagination` | Pagination settings |
| `columns` | Selected columns |
| `extra` | Any additional context |

## TTL Strategy

### Recommended TTL Values

| Data Type | Recommended TTL | Rationale |
|-----------|----------------|-----------|
| Configuration | 1 hour+ | Rarely changes |
| User profiles | 5-15 minutes | Updated occasionally |
| Lists/feeds | 1-5 minutes | Frequently updated |
| Counts | 30 seconds | Changes frequently |
| Real-time data | 0 (bypass) | Always fresh |

### Custom TTL Per Query

```typescript
import { queryEngine } from '@/lib'

// Long cache for static data
const config = await queryEngine.query<Config>({
  table: 'settings',
  ttl: 3600_000, // 1 hour
})

// Short cache for dynamic data
const notifications = await queryEngine.query<Notification>({
  table: 'notifications',
  filters: [{ column: 'user_id', operator: 'eq', value: userId }],
  ttl: 30_000, // 30 seconds
})

// Bypass cache entirely
const fresh = await queryEngine.query<Data>({
  table: 'live_data',
  bypassCache: true,
})
```

## Deduplication

The cache automatically deduplicates concurrent identical queries:

```typescript
// Both calls execute the database query only once
const [result1, result2] = await Promise.all([
  queryEngine.query<User>({ table: 'users', filters: [{ column: 'status', operator: 'eq', value: 'active' }] }),
  queryEngine.query<User>({ table: 'users', filters: [{ column: 'status', operator: 'eq', value: 'active' }] }),
])
// result1 === result2 (same reference)
```

## Eviction

When the cache reaches `maxEntries`, it evicts the 20% of entries closest to expiration (LRU-like behavior). This ensures the most recently accessed and longest-lived entries are preserved.

## Cache Invalidation

### Automatic

Mutations automatically invalidate all cache entries for the affected table:

```typescript
// These automatically invalidate all 'users' cache entries
await queryEngine.create('users', data)
await queryEngine.update('users', id, data)
await queryEngine.remove('users', id)
```

### Manual

```typescript
// Invalidate specific table
queryEngine.invalidateTable('users')

// Invalidate specific key
queryEngine.invalidateKey('qb:users:query|...')

// Invalidate everything
queryEngine.invalidateAll()
```

## Best Practices

1. **Set appropriate TTLs** - Longer for static data, shorter for dynamic
2. **Use table-level invalidation** after mutations
3. **Monitor cache stats** in production to tune TTLs
4. **Bypass cache** for real-time or critical data
5. **Use pattern invalidation** for bulk operations
