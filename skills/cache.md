# Cache System Reference

## QueryCache Singleton

### `QueryCache.getInstance(options?: CacheOptions): QueryCache`
Gets or creates the singleton cache instance.

### `QueryCache.resetInstance(): void`
Resets the singleton.

## Methods

### `get<T>(key: string): T | null`
Retrieves cached value. Returns null if expired or missing.

### `set<T>(key: string, data: T, ttl?: number): void`
Stores value with optional TTL (ms). Uses default TTL if not specified.

### `invalidate(key: string): boolean`
Removes specific key.

### `invalidatePattern(pattern: string | RegExp): number`
Removes all keys matching pattern. Returns count removed.

### `invalidateAll(): void`
Clears all entries.

### `has(key: string): boolean`
Checks if key exists and is not expired.

### `getStats(): CacheStats`
Returns `{ size, hits, misses, hitRate }`.

### `keys(): string[]`
Returns all valid (non-expired) keys.

## CacheKey Generator

### `CacheKey.fromQuery(table: string, options?): string`
Derives cache key from query parameters.

### `CacheKey.tablePrefix(table: string): string`
Returns prefix pattern for table invalidation.

### `CacheKey.forTable(table: string, id?: string): string`
Creates key for specific table/record.

### `CacheKey.forMutation(table: string): string[]`
Returns patterns to invalidate after mutation.

## Cache Options

```typescript
interface CacheOptions {
  defaultTTL?: number    // Default: 300000 (5 min)
  maxEntries?: number    // Default: 500
}
```

## Automatic Invalidation

Mutations automatically invalidate cache for their table:
- `insertOne/Many` → invalidates table prefix
- `updateById/Where` → invalidates table prefix
- `upsert` → invalidates table prefix
- `deleteById/Where/Many` → invalidates table prefix
- `softDelete/restore` → invalidates table prefix

Disable with `invalidateCache: false` in MutationOptions.

## Request Deduplication

QueryEngine maintains `pendingQueries` Map. Concurrent identical queries execute only once.
