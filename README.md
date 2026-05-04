# Supabase + React + TypeScript + TanStack Query Template

> A production-ready, fully documented Supabase template with multi-team support, realtime sync, and intelligent cached queries.

## Features

- **Authentication** - Email/password, OAuth (Google, GitHub, etc.), Magic Links, MFA, Anonymous auth
- **Database** - Full CRUD with queries, mutations, pagination, search, full-text search, transactions
- **Realtime** - Postgres change subscriptions, cross-tab broadcast, presence tracking
- **Storage** - File upload with progress, download, delete, signed URLs, validation
- **Teams** - Multi-tenant system with roles (owner/admin/member), team-aware data isolation
- **Smart Queries** - TanStack Query layer with automatic caching, optimistic updates, realtime cache sync
- **RLS** - Row-Level Security on all tables, personal + team data isolation
- **TypeScript** - Full type safety with generated database types
- **Error Handling** - Custom error classes, type guards, user-friendly messages
- **Validation** - Email, password, file, UUID, pagination validators
- **Formatting** - Date, number, currency, string, color formatters

## Quick Start

```bash
# 1. Clone
git clone <repo-url> && cd SupabaseFullLearn

# 2. Install
npm install

# 3. Configure
# Edit .env with your Supabase URL and anon key

# 4. Apply migrations
supabase link --project-ref YOUR_PROJECT_REF
supabase db push

# 5. Start
npm run dev
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Your Components                              │
│                      (src/App.tsx or custom)                         │
├─────────────────────────────────────────────────────────────────────┤
│                  Smart Query Layer (TanStack Query)                   │
│                    src/lib/query/hooks.ts                             │
│  usePersonalTodos  useCreateTodo  useTeamMembers  useStorageFiles    │
│  → Auto-caching    → Optimistic   → Realtime      → Invalidation     │
├─────────────────────────────────────────────────────────────────────┤
│               Generic Hooks (useState-based Alternative)              │
│            src/hooks/useSupabase.ts  src/hooks/useAuth.tsx            │
│  useFetch  useInsert  useUpdate  useDelete  useLiveQuery  useAuth    │
├─────────────────────────────────────────────────────────────────────┤
│                      Database Operations                              │
│                      src/lib/database/                                │
│  fetchAll  fetchById  insertOne  updateById  deleteById  upsert      │
│  subscribeToTable  createBroadcastChannel  createPresenceChannel     │
├─────────────────────────────────────────────────────────────────────┤
│                      Supabase Client                                  │
│                      src/lib/auth/client.ts                           │
│              createClient(url, anonKey, config)                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
src/
├── lib/                    # TEMPLATE CORE - Keep all files
│   ├── auth/               # Authentication: client, operations, MFA, admin
│   ├── database/           # Database: queries, mutations, realtime, teams
│   ├── storage/            # Storage: upload, download, delete, URLs
│   ├── query/              # Smart Query: hooks, keys, client (TanStack Query)
│   ├── utils/              # Utilities: errors, validators, formatters
│   ├── constants/          # Constants: realtime, auth, database, storage
│   └── index.ts            # Master barrel export
├── providers/              # React Providers (Template Core)
│   ├── QueryProvider.tsx   # TanStack Query provider
│   └── SupabaseProvider.tsx # Auth state provider
├── hooks/                  # Generic Hooks (Template Core)
│   ├── useSupabase.ts      # useFetch, useInsert, useLiveQuery, usePagination...
│   └── useAuth.tsx         # AuthProvider, useAuth, useRequireAuth...
├── types/                  # TypeScript Types (Template Core)
│   └── database.ts         # Replace with your generated types
├── App.tsx                 # ❌ DEMO - Delete when using as template
├── App.css                 # ❌ DEMO - Delete when using as template
└── main.tsx                # Entry point - Keep but modify

supabase/
└── migrations/
    ├── 0001_initial_schema.sql   # Base tables (todos, profiles)
    ├── 0002_storage_files.sql    # Storage tracking table
    └── 0003_teams_system.sql     # Teams + team_members

docs/                     # Developer documentation
skills/                   # AI agent reference documentation
```

## Smart Query Layer

The smart query layer is the **primary data access pattern**. It wraps database operations with TanStack Query for automatic caching and realtime sync.

### Example: Using Smart Hooks

```typescript
import {
  usePersonalTodos,
  useCreateTodo,
  useToggleTodo,
  useDeleteTodo,
  usePersonalTodosRealtime,
} from './lib/query'

function TodoList({ userId }: { userId: string }) {
  // Fetch (auto-cached)
  const { data: todos = [], isLoading } = usePersonalTodos(userId)

  // Realtime (auto-updates cache)
  usePersonalTodosRealtime(userId)

  // Mutations
  const createTodo = useCreateTodo()
  const toggleTodo = useToggleTodo()
  const deleteTodo = useDeleteTodo()

  // Use...
}
```

### Creating Smart Hooks for Your Tables

For any table, create 4-5 hooks:

```typescript
// 1. Query hook
export function usePosts(userId: string | undefined) {
  return useQuery({
    queryKey: ['supabase', 'posts', userId || ''],
    queryFn: async () => {
      if (!userId) return []
      return fetchAll<Post>('posts', {
        filter: (q) => q.eq('user_id', userId),
        order: { column: 'created_at', ascending: false },
      })
    },
    enabled: !!userId,
  })
}

// 2. Create mutation
export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ title, userId }: { title: string; userId: string }) => {
      return insertOne<Post>('posts', { title, user_id: userId })
    },
    onSuccess: (newPost) => {
      queryClient.setQueryData(['supabase', 'posts', newPost.user_id], (old) =>
        old ? [newPost, ...old] : [newPost]
      )
    },
  })
}

// 3. Realtime hook
export function usePostsRealtime(userId: string | undefined) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!userId) return
    const channel = subscribeToTable<Post>(
      { table: 'posts', filter: `user_id=eq.${userId}` },
      {
        onInsert: (data) => queryClient.setQueryData(['supabase', 'posts', userId], (old) => old ? [data, ...old] : [data]),
        onUpdate: (data) => queryClient.setQueryData(['supabase', 'posts', userId], (old) => old ? old.map(p => p.id === data.id ? data : p) : old),
        onDelete: (data) => queryClient.setQueryData(['supabase', 'posts', userId], (old) => old ? old.filter(p => p.id !== data.id) : old),
      }
    )
    return () => supabase.removeChannel(channel)
  }, [userId, queryClient])
}
```

See `docs/SMART_QUERIES.md` for the complete reference.

## Documentation

| Document | Description |
|----------|-------------|
| [docs/TEMPLATE_STRUCTURE.md](docs/TEMPLATE_STRUCTURE.md) | What to keep vs delete when using as template |
| [docs/SMART_QUERIES.md](docs/SMART_QUERIES.md) | Complete smart query layer reference |
| [docs/SETUP_CHECKLIST.md](docs/SETUP_CHECKLIST.md) | Step-by-step setup guide |
| [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md) | Authentication guide |
| [docs/DATABASE.md](docs/DATABASE.md) | Database operations guide |
| [docs/REALTIME.md](docs/REALTIME.md) | Realtime subscriptions guide |
| [docs/STORAGE.md](docs/STORAGE.md) | File storage guide |
| [skills/](skills/) | AI agent reference documentation |

## Using This Template

1. **Keep** everything in `src/lib/`, `src/providers/`, `src/hooks/`, `src/types/`
2. **Delete** `src/App.tsx`, `src/App.css`
3. **Replace** `src/types/database.ts` with your generated types
4. **Add** smart hooks for your tables in `src/lib/query/hooks.ts`
5. **Add** query keys for your tables in `src/lib/query/keys.ts`
6. **Create** your own `src/App.tsx`

## Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `@supabase/supabase-js` | Supabase client |
| `@tanstack/react-query` | Smart query layer (caching, mutations, realtime) |
| `react` / `react-dom` | React framework |
| `typescript` | Type safety |
| `vite` | Build tool |

## License

MIT
