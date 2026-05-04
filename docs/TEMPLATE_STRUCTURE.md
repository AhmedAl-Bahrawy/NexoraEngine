# Template Structure - What to Keep vs Delete

> Use this guide when starting a new project with this template.

## ✅ KEEP (Template Core)

### `src/lib/` - Core Library
Every file in this directory is part of the template and should be kept.

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `auth/` | All authentication operations | client.ts, operations.ts, mfa.ts, admin.ts |
| `database/` | All database read/write/realtime operations | queries.ts, mutations.ts, realtime.ts, teams.ts |
| `storage/` | All file storage operations | index.ts (upload, download, delete, URLs) |
| `query/` | **Smart Query Layer** (TanStack Query) | hooks.ts (smart hooks), keys.ts (cache keys), client.ts |
| `utils/` | Error handling, validation, formatting | errors.ts, validators.ts, formatters.ts |
| `constants/` | Configuration constants | supabase.ts (REALTIME, AUTH, DATABASE, STORAGE, ERROR_CODES) |

### `src/providers/` - React Providers
| File | Purpose |
|------|---------|
| `QueryProvider.tsx` | Wraps app with TanStack Query (required for smart hooks) |
| `SupabaseProvider.tsx` | Auth state provider with connection monitoring |

### `src/hooks/` - Generic Hooks (Alternative Pattern)
| File | Purpose |
|------|---------|
| `useSupabase.ts` | useState-based hooks: useFetch, useInsert, useUpdate, useDelete, useRealtime, useLiveQuery, usePagination, useOptimisticUpdate, useStorage, useRpc, useBatch, useSearch, useRawQuery, useCount, useAggregate, useJoin |
| `useAuth.tsx` | Auth context: AuthProvider, useAuth, useRequireAuth, useIsAdmin, useUserMetadata, useOAuthCallback, usePasswordReset, useSession, useMFA, useAnonymousAuth, useIdentityLinking |

### `src/types/` - TypeScript Types
| File | Purpose |
|------|---------|
| `database.ts` | Database types - **REPLACE with your generated types** |

### `supabase/` - Migrations
| File | Purpose |
|------|---------|
| `migrations/0001_initial_schema.sql` | Base schema |
| `migrations/0002_storage_files.sql` | Storage tracking |
| `migrations/0003_teams_system.sql` | Teams system |
| `config.toml` | Supabase configuration |

### `skills/` - AI Agent Documentation
All files in `skills/` are documentation for AI agents. Keep them for reference.

### `docs/` - Developer Documentation
All files in `docs/` are developer documentation. Keep them for reference.

### `src/main.tsx` - Entry Point
Keep but modify to use your own App component.

---

## ❌ DELETE (Demo/Test Code)

| File | Reason |
|------|--------|
| `src/App.tsx` | Demo application with todos, teams, storage, realtime views |
| `src/App.css` | Demo styles |
| `src/components/` | Empty directory - for demo components |

---

## 🔧 MODIFY (Customize for Your Project)

### `src/types/database.ts`
Replace with your generated types:
```bash
supabase gen types typescript --project-id YOUR_PROJECT_REF > src/types/database.ts
```

### `src/lib/query/hooks.ts`
Add smart hooks for your tables. Follow the pattern in the file:
1. Query hook (useQuery + fetchAll)
2. Create mutation (useMutation + insertOne + cache update)
3. Update mutation (useMutation + updateById + cache update)
4. Delete mutation (useMutation + deleteById + cache update)
5. Realtime hook (subscribeToTable + setQueryData)

### `src/main.tsx`
Replace the App import with your own:
```typescript
import YourApp from './YourApp'
// ...
<QueryProvider>
  <YourApp />
</QueryProvider>
```

### `.env`
Update with your Supabase project credentials:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### `supabase/migrations/`
Add new migrations for your tables:
```bash
supabase migration new your_feature_name
```

---

## Quick Migration Checklist

1. [ ] Delete `src/App.tsx`, `src/App.css`
2. [ ] Update `.env` with your Supabase credentials
3. [ ] Generate types: `supabase gen types typescript --project-id YOUR_REF > src/types/database.ts`
4. [ ] Push migrations: `supabase db push`
5. [ ] Create your own `src/App.tsx`
6. [ ] Add smart hooks for your tables in `src/lib/query/hooks.ts`
7. [ ] Update `src/lib/query/keys.ts` with your table query keys
8. [ ] Update `src/main.tsx` if needed
