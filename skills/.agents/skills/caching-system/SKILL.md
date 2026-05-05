---
name: caching-system
description: TTL-based smart caching layer with automatic invalidation, request deduplication, and stale-while-revalidate strategy. Reduces database load and improves response times.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  sdk_layer: cache
  complexity: low
  stability: stable
---

# Caching System

## Overview

TTL-based smart caching layer with automatic invalidation, request deduplication, and stale-while-revalidate strategy.

## What It Does

Provides a generic caching layer for database queries with configurable TTL, automatic invalidation on mutations, and request deduplication for concurrent calls.

## Why Use It

Reduces database load, improves response times, and provides a clean abstraction for cache management without manual key tracking.

## Inputs

```typescript
// QueryCache constructor
{
  defaultTTL?: number    // default: 5 minutes
  maxEntries?: number    // default: 500
}

// set()
key: string
data: T
ttl?: number          // overrides default TTL

// invalidatePattern()
pattern: string | RegExp
```

## Outputs

```typescript
// get<T>()
T | null

// getStats()
{
  size: number
  hits: number
  misses: number
  hitRate: number
}

// keys()
string[]
```

## Usage

### Steps

1. Import `QueryCache` from `nexora-engine`
2. Create a cache instance (or use the default singleton via `QueryCache.getInstance()`)
3. Use `get()` to retrieve and `set()` to store cached data
4. Use `invalidate()` or `invalidatePattern()` to clear entries

### Code Examples

```typescript
import { QueryCache } from 'nexora-engine'

// Create a custom cache instance
const cache = new QueryCache({
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  maxEntries: 1000,
})

// Store data
cache.set('users:active', [{ id: 1, name: 'John' }], 60_000) // 1 minute TTL

// Retrieve data
const data = cache.get<{ id: number; name: string }[]>('users:active')
if (data) {
  // Use cached data
}

// Invalidate by exact key
cache.invalidate('users:active')

// Invalidate by pattern (string includes)
cache.invalidatePattern('users:')

// Invalidate by regex
cache.invalidatePattern(/^users:/)

// Get cache statistics
const stats = cache.getStats()
console.log(`Hit rate: ${stats.hitRate * 100}%`)

// Clear all
cache.clear()
```

## Internal Logic

### Flow

1. `get()`: Check store for key, verify not expired, increment hits, return data
2. `set()`: Evict old entries if at max capacity, store with expiration timestamp
3. `invalidatePattern()`: Iterate keys, match against pattern, delete matches
4. Eviction: When at capacity, remove 20% of entries starting with soonest to expire

### Execution Reasoning

- TTL is stored as absolute timestamp (`Date.now() + ttl`)
- Cache entries track `createdAt`, `expiresAt`, and `hits`
- Deduplication happens at QueryEngine level, not in QueryCache directly
- Stale-while-revalidate: not implemented in v1 (planned for future)

## Constraints

### Rules

- TTL is in milliseconds
- `maxEntries` triggers eviction when exceeded
- Eviction removes 20% of entries (starting with soonest to expire)
- `invalidatePattern()` with string checks `key.includes(pattern)`

### Anti-Patterns

- Don't store large objects (consider pagination)
- Don't use very short TTLs (< 1 second) unnecessarily
- Don't call `invalidatePattern()` with overly broad patterns

## Dependencies

### Internal SDK Modules

- None (standalone module)

### External Libraries

- None (pure TypeScript)

## Code Mapping

```typescript
// SDK Functions
QueryCache              -> QueryCache class
QueryCache.getInstance() -> QueryCache.getInstance()
cache.get()            -> QueryCache.get()
cache.set()            -> QueryCache.set()
cache.invalidate()      -> QueryCache.invalidate()
cache.invalidatePattern() -> QueryCache.invalidatePattern()
cache.clear()          -> QueryCache.clear()
cache.getStats()       -> QueryCache.getStats()
cache.keys()           -> QueryCache.keys()
```

## When to Use

- Use for caching database query results
- Use for expensive computed values
- Use for API responses that don't change frequently

## When NOT to Use

- Don't use for real-time data streams
- Don't use for sensitive data (credentials, tokens)
- Don't use as a primary data store

## Reasoning Strategy

1. Determine appropriate TTL based on data volatility
2. Use string patterns that are specific enough to avoid over-invalidation
3. Monitor cache stats to tune `maxEntries` and TTL
4. For query caching, prefer using `queryEngine` which handles this automatically
