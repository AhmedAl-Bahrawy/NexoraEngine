# Supabase Backend Template

> A fully generic, production-ready Supabase backend template. Zero domain assumptions. Reusable across any project.

## Features

- **Authentication** - Email/password, OAuth, Magic Links, MFA, Anonymous auth, Admin operations, Auth middleware
- **Database** - Fully dynamic CRUD with composable filtering, sorting, and pagination
- **Query Engine** - Smart query system with automatic caching, deduplication, and TTL-based expiration
- **Realtime** - Postgres change subscriptions, cross-tab broadcast, presence tracking
- **Storage** - File upload, download, signed URLs, validation, and management
- **Error Handling** - Centralized error classes, type guards, consistent responses
- **Validation** - Input validation, file validators, pagination guards
- **Retry Logic** - Exponential backoff retry with configurable attempts and delays
- **Timeout Handling** - AbortController-based timeout for all queries and mutations
- **Rate Limiting** - Configurable rate limiter with window-based tracking
- **TypeScript** - Full type safety throughout the entire codebase

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
# Create .env with your Supabase credentials:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key

# 3. Build
npm run build

# 4. Type check
npm run typecheck
```

## Architecture

```
src/lib/
├── auth/           Authentication: client, operations, MFA, admin, middleware
├── database/       Database: queries, mutations, realtime
├── storage/        Storage: upload, download, delete, URLs
├── cache/          Smart caching: TTL, key derivation, deduplication
├── query-engine/   Query system: builder, engine, composition
├── utils/          Utilities: errors, retry, validate, rate-limit, validators
├── constants/      Configuration constants
└── index.ts        Master barrel export

skills/             AI knowledge base for autonomous operation
```

## Usage

### Direct Database Operations

```typescript
import { fetchAll, fetchById, insertOne, updateById, deleteById } from '@/lib'

// Fetch with retry and timeout
const users = await fetchAll<User>('users', { timeout: 5000, retries: 3 })
const user = await fetchById<User>('users', 'user-id')

// Fetch with filters
const activeUsers = await fetchWhere<User>('users', [
  { column: 'status', operator: 'eq', value: 'active' },
  { column: 'age', operator: 'gte', value: 18 },
])

// Mutate with validation
const newUser = await insertOne<User>('users', { name: 'John', email: 'john@example.com' }, {
  validate: [
    { field: 'name', required: true, minLength: 2 },
    { field: 'email', required: true, type: 'email' },
  ],
})
const updated = await updateById<User>('users', 'user-id', { name: 'Jane' })
await deleteById('users', 'user-id')
```

### Query Builder (Composable)

```typescript
import { createQuery } from '@/lib'

const query = await createQuery<User>('users')
query.filters([{ column: 'status', operator: 'eq', value: 'active' }])
query.sort([{ column: 'created_at', ascending: false }])
query.paginate(1, 20)
const { data, count } = await query.execute()
```

### Query Engine (Cached)

```typescript
import { queryEngine } from '@/lib'

// Cached query (auto-deduplicates concurrent calls)
const users = await queryEngine.query<User>({
  table: 'users',
  filters: [{ column: 'status', operator: 'eq', value: 'active' }],
  sort: [{ column: 'created_at', ascending: false }],
  pagination: { limit: 20 },
  ttl: 60_000, // 1 minute cache
})

// Mutations auto-invalidate related cache
const newUser = await queryEngine.create<User>('users', { name: 'John' })
await queryEngine.update<User>('users', 'user-id', { name: 'Jane' })
await queryEngine.remove('users', 'user-id')

// Manual invalidation
queryEngine.invalidateTable('users')
queryEngine.invalidateAll()
```

### Authentication

```typescript
import { signInWithPassword, signUp, signOut, getUser, enforceAuth } from '@/lib'

// Sign in
const { user, session } = await signInWithPassword({ email, password })

// Sign up
const { user, session } = await signUp({ email, password, metadata: { name: 'John' } })

// Get current user
const user = await getUser()

// Auth middleware
const ctx = await enforceAuth({ requireRole: 'admin' })
// ctx.user, ctx.userId, ctx.email, ctx.role available
```

### Realtime

```typescript
import { subscribeToTable, unsubscribe } from '@/lib'

const channel = subscribeToTable<User>(
  { table: 'users', event: '*' },
  {
    onInsert: (user) => console.log('New user:', user),
    onUpdate: (user) => console.log('Updated user:', user),
    onDelete: (user) => console.log('Deleted user:', user),
  }
)

// Cleanup
await unsubscribe(channel)
```

### Storage

```typescript
import { uploadFile, getPublicUrl, downloadFile, deleteFile } from '@/lib'

// Upload with validation
const { path } = await uploadImage('bucket', 'avatars/user.jpg', file)

// Get URL
const url = getPublicUrl('bucket', path)

// Download
const blob = await downloadFile('bucket', path)

// Delete
await deleteFile('bucket', path)
```

## Documentation

| Document | Description |
|----------|-------------|
| [docs/CACHE.md](docs/CACHE.md) | Caching strategy, TTL, invalidation |
| [docs/QUERY_ENGINE.md](docs/QUERY_ENGINE.md) | Query engine, builder, composition |
| [docs/ERROR_HANDLING.md](docs/ERROR_HANDLING.md) | Error classes, handling patterns |
| [docs/EXTENDING.md](docs/EXTENDING.md) | How to extend the system |
| [skills/](skills/) | AI knowledge base for autonomous operation |

## Available Scripts

```bash
npm run build       # Compile TypeScript
npm run typecheck   # Type check without emitting
npm run lint        # Run ESLint
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `@supabase/supabase-js` | Supabase client |
| `@types/node` | Node.js type definitions |

## License

MIT
