---
name: sdk-architecture
description: Layered SDK design with Core Engine, Query Layer, Optimization Layer, Validation Layer, Error Layer, Auth Layer, and Utility Layer for maximum reusability and clean abstraction.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  sdk_layer: architecture
  complexity: high
  stability: stable
---

# SDK Architecture

## Overview

Layered SDK design with Core Engine, Query Layer, Optimization Layer, Validation Layer, Error Layer, Auth Layer, and Utility Layer for maximum reusability and clean abstraction.

## What It Does

Defines the architectural layers of Nexora Engine SDK, showing how each layer interacts while maintaining clean separation of concerns and no domain-specific logic.

## Why Use It

Ensures the SDK remains maintainable, extensible, and reusable across any application type without leaking internal implementation details.

## Architecture Layers

### Core Engine Layer (`src/lib/core/`)
- **client.ts**: Supabase client initialization and singleton management
- **pipeline.ts**: Request pipeline with timeout and retry support
- **retry.ts**: Exponential backoff retry logic

### Query Layer (`src/lib/query/` + `src/lib/database/`)
- **queries.ts**: Read operations (fetchAll, fetchById, search, count, etc.)
- **mutations.ts**: Write operations (insert, update, delete, upsert)
- **builder.ts**: Fluent query builder (QueryBuilder)
- **engine.ts**: Cached query engine (QueryEngine)

### Optimization Layer (`src/lib/cache/`)
- **cache.ts**: TTL-based cache with dedup and eviction
- **keys.ts**: Cache key derivation and patterns

### Validation Layer (`src/lib/validation/`)
- **schema.ts**: Zod-based validation, safeValidate, createValidator
- **commonSchemas**: Pre-built schemas for email, password, uuid, etc.

### Error Layer (`src/lib/errors/`)
- **nexora-error.ts**: Error hierarchy (NexoraError + specialized types)

### Auth Layer (`src/lib/auth/`)
- **operations.ts**: Sign in/up, OAuth, password management
- **mfa.ts**: Multi-factor authentication
- **admin.ts**: Admin operations
- **middleware.ts**: Route protection, role checks

### Utility Layer (`src/lib/utils/`)
- **validators.ts**: Input validation helpers (email, password, file)
- **formatters.ts**: Data formatting (dates, files, text)
- **rate-limit.ts**: Rate limiting functionality

## Inputs

```typescript
// Creating SDK client
{
  url: string
  anonKey: string
  serviceRoleKey?: string
  options?: {
    auth?: { autoRefreshToken?: boolean; persistSession?: boolean }
    global?: { headers?: Record<string, string> }
    db?: { schema?: string }
  }
}
```

## Outputs

```typescript
// SDK instance
{
  // Query layer
  fetchAll, fetchById, insertOne, updateById, deleteById, ...
  // Query engine
  queryEngine: QueryEngine
  createQuery: () => QueryBuilder
  // Auth layer
  signInWithPassword, signUp, signOut, enforceAuth, ...
  // Cache layer
  QueryCache, deriveCacheKey, ...
  // Validation layer
  validate, safeValidate, commonSchemas, ...
  // Error layer
  NexoraError, AuthError, ValidationError, ...
}
```

## Usage

### Steps

1. Install: `npm install nexora-engine`
2. Initialize: `createNexoraClient(config)` or use env vars
3. Import and use desired layer functions

### Code Examples

```typescript
import { createNexoraClient, queryEngine, signInWithPassword } from 'nexora-engine'

// Initialize once
createNexoraClient({
  url: process.env.SUPABASE_URL!,
  anonKey: process.env.SUPABASE_ANON_KEY!,
})

// Use any layer
const users = await queryEngine.query<User>({ table: 'users' })
const { user } = await signInWithPassword(creds)
```

## Internal Logic

### Flow

1. **Core layer** initializes Supabase client (singleton)
2. **Query layer** builds on core client for DB operations
3. **Cache layer** wraps query layer with TTL caching
4. **Validation layer** provides Zod schemas for input validation
5. **Error layer** normalizes all errors to NexoraError types
6. **Auth layer** wraps Supabase Auth with enhanced error handling
7. **Utility layer** provides common helper functions (validators, formatters, rate limiting)

### Dependency Graph

```
Application
├── Public API (index.ts)
│   ├── Core Layer (client, pipeline, retry)
│   ├── Query Layer (queries, mutations, builder, engine)
│   │   └── Cache Layer (cache, keys)
│   ├── Validation Layer (schema, commonSchemas)
│   ├── Error Layer (nexora-error)
│   ├── Auth Layer (operations, mfa, admin, middleware)
│   │   └── Core Layer (client)
│   └── Utility Layer (validators, formatters, rate-limit)
```

## Constraints

### Rules

- No domain-specific logic in any layer
- No business logic allowed
- Each layer must be independently composable
- Internal modules must not be directly exported

### Anti-Patterns

- Don't import internal paths (use public API)
- Don't mix layers (e.g., validation in core)
- Don't add application-specific helpers

## Dependencies

### Internal SDK Modules

All layers are internal; consumers only use public API.

### External Libraries

- `@supabase/supabase-js`: Supabase client
- `zod`: Schema validation

## Code Mapping

```typescript
// Public API entry points
'nexora-engine'              -> src/lib/index.ts
'nexora-engine/core'         -> (internal only)
'nexora-engine/query'        -> src/lib/query/index.ts
'nexora-engine/cache'        -> src/lib/cache/index.ts
'nexora-engine/validation'   -> src/lib/validation/index.ts
'nexora-engine/auth'         -> src/lib/auth/index.ts
```

## When to Use

- Use this architecture for any backend SDK built on Supabase
- Follow layered approach for new features
- Keep layers independent and composable

## When NOT to Use

- Don't add domain logic to SDK layers
- Don't bypass layers (e.g., use Supabase client directly)
- Don't create circular dependencies between layers

## Reasoning Strategy

1. Identify which layer the feature belongs to
2. Implement in the appropriate layer
3. Export through public API only
4. Update skills system to match
