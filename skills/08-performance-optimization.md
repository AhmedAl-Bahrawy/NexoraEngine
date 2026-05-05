# Skill: Performance Optimization Patterns

## id
`nexora.performance-optimization`

## name
Performance Optimization Patterns

## category
optimization

## description
Performance-first patterns including request deduplication, smart caching, TTL control, and optimized Supabase query patterns.

## intent
### what
Provides patterns and utilities for optimizing SDK performance: caching strategies, query optimization, request deduplication, and minimal latency patterns.

### why
Ensures the SDK delivers fast response times, minimal Supabase calls, and efficient resource usage in production environments.

## inputs
```typescript
// TTL configuration
ttl?: number  // milliseconds (default: 5 minutes)

// Request options
{
  timeout?: number    // default: 30000ms
  retries?: number    // default: 3
  bypassCache?: boolean
}

// Cache configuration
{
  defaultTTL?: number   // default: 300000 (5 min)
  maxEntries?: number  // default: 500
}
```

## outputs
```typescript
// Optimized query response
{
  data: T[] | null
  count: number
  fromCache: boolean
}

// Cache stats
{
  size: number
  hits: number
  misses: number
  hitRate: number
}
```

## usage
### steps
1. Configure appropriate TTLs based on data volatility
2. Use `queryEngine` for automatic caching and deduplication
3. Monitor cache stats to tune performance
4. Use `bypassCache` only when freshness is critical

### code examples
```typescript
import { queryEngine, QueryCache } from 'nexora-engine'

// 1. Use cached queries for frequently accessed data
const users = await queryEngine.query<User>({
  table: 'users',
  filters: [{ column: 'status', operator: 'eq', value: 'active' }],
  ttl: 60_000, // 1 minute for volatile data
})

// 2. Longer TTL for static data
const settings = await queryEngine.query<Settings>({
  table: 'settings',
  ttl: 10 * 60 * 1000, // 10 minutes for static data
})

// 3. Monitor cache performance
const stats = queryEngine.getCacheStats()
console.log(`Cache hit rate: ${(stats.hitRate * 100).toFixed(1)}%`)

// 4. Custom cache for specific needs
const customCache = new QueryCache({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxEntries: 1000,
})
customCache.set('expensive-computation', result)

// 5. Bypass cache only when needed
const freshData = await queryEngine.query<User>({
  table: 'users',
  filters: [{ column: 'id', operator: 'eq', value: userId }],
  bypassCache: true,
})

// 6. Use pagination for large datasets
const page1 = await queryEngine.queryPaginated<User>({
  table: 'audit_logs',
  page: 1,
  pageSize: 50,
  ttl: 30_000,
})
```

## logic
### internal flow
1. **Request Deduplication**: Concurrent identical queries share the same promise
2. **Cache-First**: Check cache before hitting Supabase
3. **TTL Expiration**: Automatic cleanup of expired entries
4. **LRU Eviction**: Remove 20% of entries when at capacity (soonest to expire first)
5. **Auto-Invalidation**: Mutations invalidate related cache entries

### optimization strategies
- **Hot Data**: Use shorter TTL, let cache handle frequency
- **Cold Data**: Use longer TTL to avoid unnecessary queries
- **Deduplication**: Prevents N+1 style duplicate requests
- **Bulk Operations**: Use `insertMany`, `deleteMany` instead of loops

## constraints
### rules
- TTL must be in milliseconds
- `maxEntries` triggers eviction at 80% capacity
- Deduplication only works within same event loop tick
- Pagination is required for large datasets (>1000 rows)

### anti-patterns
- Don't set TTL=0 (disables caching entirely, use `bypassCache`)
- Don't use `bypassCache: true` for all queries (defeats purpose)
- Don't create too many cache instances (use singleton)
- Don't forget to invalidate cache after bulk mutations

## dependencies
### internal SDK modules
- `QueryCache` (from `./cache/cache`)
- `QueryEngine` (from `./query-engine/engine`)
- `executeRequest` (from `./core/pipeline`)

### external libraries
- None (pure optimization patterns)

## code_mapping
```typescript
// Performance Functions
queryEngine.query()        -> Cached + deduplicated query
queryEngine.getCacheStats() -> Cache hit/miss statistics
QueryCache.set()            -> Store with TTL
QueryCache.get()            -> Retrieve with expiration check
QueryCache.invalidatePattern() -> Selective invalidation
```

## ai_instructions
### when to use
- Use caching for read-heavy workloads
- Use pagination for large datasets
- Use `bypassCache` only for real-time data
- Monitor `hitRate` to tune TTL and `maxEntries`

### when NOT to use
- Don't cache highly volatile data (>10 changes/minute)
- Don't use long TTLs for user-specific data
- Don't bypass cache for static reference data

### reasoning strategy
1. Profile: Is this data read frequently? → Cache it
2. Measure: What's the data volatility? → Set TTL accordingly
3. Monitor: Check `hitRate` → Tune cache parameters
4. Optimize: Use bulk operations over loops
5. Validate: Ensure mutations invalidate correctly

## metadata
- complexity: medium
- stability: stable
- sdk_layer: optimization
