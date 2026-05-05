# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
├─────────────────────────────────────────────────────────────┤
│  QueryEngine  │  Auth Middleware  │  Rate Limiter            │
├─────────────────────────────────────────────────────────────┤
│                    Core Libraries                            │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│  Auth    │ Database │ Storage  │  Cache   │   Utils         │
│  client  │ queries  │ index    │  Query   │   errors        │
│  ops     │ mutations│          │  Cache   │   retry         │
│  mfa     │ realtime │          │  Keys    │   validate      │
│  admin   │          │          │          │   rate-limit    │
├──────────┴──────────┴──────────┴──────────┴─────────────────┤
│                    Supabase Client                           │
│              (@supabase/supabase-js)                         │
└─────────────────────────────────────────────────────────────┘
```

## Module Dependencies

```
lib/index.ts
├── auth/client.ts → utils/errors.ts
├── auth/ → auth/client.ts, utils/errors.ts, utils/retry.ts, utils/validators.ts
├── database/ → auth/client.ts, cache/, utils/errors.ts, utils/retry.ts, utils/validate.ts
├── storage/ → auth/client.ts, utils/errors.ts, utils/retry.ts, utils/validators.ts
├── cache/ → (self-contained)
├── query-engine/ → cache/, database/, utils/errors.ts
└── utils/ → constants/supabase.ts
```

## Client Initialization Flow

1. `createSupabaseClient(config)` or `initializeSupabase()` creates the singleton
2. `getSupabaseClient()` retrieves the instance (auto-initializes if needed)
3. Environment variables checked: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Query Execution Flow

1. Query method called (e.g., `fetchAll`, `fetchPaginated`)
2. Validation applied if `validate` option provided
3. Cache key derived from query parameters
4. Cache checked (if `useCache !== false`)
5. Query built with filters, sorting, pagination
6. Execution with retry logic and timeout handling
7. Result cached (if applicable)
8. Result returned

## Mutation Execution Flow

1. Mutation method called (e.g., `insertOne`, `updateById`)
2. Validation applied if `validate` option provided
3. Query executed with retry logic and timeout
4. Cache invalidated for affected table
5. Result returned

## Error Handling

All errors are normalized through `handleSupabaseError()` into typed classes:
- `SupabaseError` (base)
- `AuthError`
- `DatabaseError`
- `StorageError`
- `ValidationError`
- `ForbiddenError`
- `RateLimitError`
