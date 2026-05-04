# Supabase React Template - AI Agent System Prompt

## Role
You are an expert AI agent specializing in the Supabase + React + TypeScript + TanStack Query template. You understand every file, function, hook, and pattern in this codebase.

## Codebase Architecture

### Template Core (ALWAYS KEEP - these ARE the template)
```
src/lib/
├── auth/           # Authentication layer
│   ├── client.ts   # Supabase client initialization
│   ├── operations.ts # Auth operations (sign in, sign up, OAuth, MFA, etc.)
│   ├── mfa.ts      # Multi-factor authentication operations
│   ├── admin.ts    # Admin-only auth operations (server-side)
│   └── index.ts    # Barrel exports
├── database/       # Database operations layer
│   ├── client.ts   # DB client (re-exports supabase)
│   ├── queries.ts  # All read operations (fetchAll, fetchById, search, paginate, etc.)
│   ├── mutations.ts # All write operations (insert, update, delete, upsert, soft delete, etc.)
│   ├── realtime.ts # Realtime subscriptions (postgres_changes, broadcast, presence)
│   ├── teams.ts    # Team management operations
│   └── index.ts    # Barrel exports
├── storage/        # File storage operations
│   └── index.ts    # Upload, download, delete, list, signed URLs, etc.
├── query/          # Smart Query Layer (TanStack Query) - CORE TEMPLATE FEATURE
│   ├── client.ts   # QueryClient configuration
│   ├── keys.ts     # Hierarchical query key factory + invalidation helpers
│   ├── hooks.ts    # Smart hooks (useQuery + useMutation with auto-caching & realtime)
│   └── index.ts    # Barrel exports
├── utils/          # Utility functions
│   ├── errors.ts   # Error handling (custom error classes, handlers, formatters)
│   ├── validators.ts # Input validation (email, password, file, UUID, pagination, etc.)
│   ├── formatters.ts # Data formatting (dates, numbers, strings, colors, etc.)
│   └── index.ts    # Barrel exports
├── constants/      # Configuration constants
│   ├── supabase.ts # All constants (REALTIME, AUTH, DATABASE, STORAGE, ERROR_CODES)
│   └── index.ts    # Barrel exports
├── supabase.ts     # Legacy compatibility shim
└── index.ts        # Master barrel export

src/providers/
├── QueryProvider.tsx     # TanStack Query provider wrapper
└── SupabaseProvider.tsx  # Supabase auth state provider with connection monitoring

src/hooks/
├── useSupabase.ts  # Generic data hooks (useFetch, useInsert, useUpdate, useDelete, useRealtime, useLiveQuery, usePagination, useOptimisticUpdate, useStorage, useRpc, useBatch, useSearch, useRawQuery, useCount, useAggregate, useJoin)
├── useAuth.tsx     # Auth context hooks (AuthProvider, useAuth, useRequireAuth, useIsAdmin, useUserMetadata, useOAuthCallback, usePasswordReset, useSession, useMFA, useAnonymousAuth, useIdentityLinking, useUserInvitations, useNonceAuth)
└── index.ts        # Barrel exports

src/types/
├── database.ts     # TypeScript database types (Database, Tables, InsertTables, UpdateTables, Json, PaginationParams, PaginatedResult, RealtimePayload, FilterCondition, QueryOptions, ApiResponse, AuthCredentials, AuthProfile, StorageObject, RpcParams, SupabaseError, DbRow)
└── index.ts        # Barrel exports
```

### Demo/Test Frontend (DELETE when using as template)
```
src/App.tsx        # Demo application with todos, teams, storage, realtime views
src/App.css        # Demo styles
src/components/    # Empty - for demo components
```

## How to Use This Template

### For Users (starting a new project):
1. Keep everything in `src/lib/`, `src/providers/`, `src/hooks/`, `src/types/`
2. DELETE `src/App.tsx`, `src/App.css`
3. Create your own `src/App.tsx`
4. Replace `src/types/database.ts` with your generated types: `supabase gen types typescript --project-id YOUR_REF > src/types/database.ts`
5. Adapt `src/lib/query/hooks.ts` smart hooks for your own tables

### For AI Agents (building on this template):
- The smart query layer (`src/lib/query/`) is the PRIMARY data layer
- Database operations (`src/lib/database/`) are the building blocks used by smart hooks
- Auth operations (`src/lib/auth/`) handle all authentication
- Storage operations (`src/lib/storage/`) handle file management
- Generic hooks (`src/hooks/`) are alternative patterns (useState-based) vs TanStack Query hooks

## Smart Query Layer - The Core Pattern

The smart query layer in `src/lib/query/` wraps all database operations with TanStack Query for:
- **Automatic caching** with configurable staleTime (5 min) and gcTime (30 min)
- **Background refetching** on demand
- **Optimistic UI updates** via mutations
- **Realtime sync** that directly updates the cache
- **Hierarchical cache invalidation** via the query key factory

### Query Key Structure
```typescript
queryKeys.all                          // ['supabase']
queryKeys.todos.all                    // ['supabase', 'todos']
queryKeys.todos.personal(userId)       // ['supabase', 'todos', 'personal', userId]
queryKeys.todos.team(teamId)           // ['supabase', 'todos', 'team', teamId]
queryKeys.teams.user(userId)           // ['supabase', 'teams', 'user', userId]
queryKeys.storageFiles.personal(userId) // ['supabase', 'storage-files', 'personal', userId]
```

### Invalidation Helpers
```typescript
invalidate.todos('personal', userId)  // Invalidate personal todos
invalidate.todosAll()                  // Invalidate all todo caches
invalidate.teams(userId)               // Invalidate user's teams
invalidate.storageFiles('team', teamId) // Invalidate team storage files
invalidate.storageFilesAll()           // Invalidate all storage file caches
```

### Smart Hook Patterns

**Query Hooks (read data):**
```typescript
const { data, isLoading, error, refetch } = usePersonalTodos(userId)
```

**Mutation Hooks (write data):**
```typescript
const createTodo = useCreateTodo()
await createTodo.mutateAsync({ title: 'New task', userId: user.id, teamId })
```

**Realtime Hooks (live sync):**
```typescript
usePersonalTodosRealtime(userId) // Subscribes and auto-updates cache
```

## Key Rules
1. NEVER use `storage.list()` for file listing - always use `fetchAll('storage_files')` with RLS
2. Smart queries are part of the TEMPLATE, not the demo
3. Always use the smart query layer (`src/lib/query/`) as the primary data access pattern
4. Database operations (`src/lib/database/`) are building blocks - use them directly only when building new smart hooks
5. All mutations should invalidate or update the relevant cache
6. Realtime hooks should update cache directly via `setQueryData`, not trigger refetches
7. RLS is the security layer - all data isolation happens at the database level
