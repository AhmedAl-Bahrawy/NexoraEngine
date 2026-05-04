# Supabase React Template - Skills Index

This template provides a complete, production-ready Supabase + React + TypeScript + TanStack Query architecture.

## 📚 Skills Documentation

| File | Topic | Description |
|------|-------|-------------|
| [01_authentication.md](./01_authentication.md) | Authentication | Client setup, sign in/up, OAuth, MFA, admin operations |
| [02_database.md](./02_database.md) | Database | Queries (fetchAll, fetchById, search, paginate), Mutations (insert, update, delete, upsert), Transactions |
| [03_realtime.md](./03_realtime.md) | Realtime | Postgres changes, broadcast channels, presence tracking |
| [04_storage.md](./04_storage.md) | Storage | Upload, download, delete, signed URLs, file validation |
| [05_rls_policies.md](./05_rls_policies.md) | RLS | Row-Level Security policies, personal vs team access |
| [06_utilities.md](./06_utilities.md) | Utilities | Error handling, validation, formatting |
| [07_hooks_patterns.md](./07_hooks_patterns.md) | Hooks | Smart Query hooks (TanStack Query) + Generic hooks (useState-based) |
| [08_migrations.md](./08_migrations.md) | Migrations | Schema management, applying, creating, rolling back |
| [09_teams.md](./09_teams.md) | Teams | Multi-tenant system, roles, team-aware data access |
| [10_debugging_gotchas.md](./10_debugging_gotchas.md) | Debugging | Error codes, debugging checklist, common gotchas |
| [operations-flow.md](./operations-flow.md) | Operations Map | Complete function reference with parameters and returns |
| [prompt.md](./prompt.md) | System Prompt | AI agent system prompt with full architecture reference |

## 🏗️ Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│                   UI Components                      │
│              (src/App.tsx - DEMO)                    │
├─────────────────────────────────────────────────────┤
│           Smart Query Hooks (TanStack Query)         │
│              (src/lib/query/hooks.ts)                │
│   usePersonalTodos, useCreateTodo, useTeamMembers    │
├─────────────────────────────────────────────────────┤
│          Generic Hooks (useState-based)              │
│         (src/hooks/useSupabase.ts, useAuth.tsx)      │
│   useFetch, useInsert, useLiveQuery, useAuth         │
├─────────────────────────────────────────────────────┤
│              Database Operations                     │
│           (src/lib/database/)                        │
│   fetchAll, insertOne, updateById, deleteById        │
├─────────────────────────────────────────────────────┤
│              Supabase Client                         │
│             (src/lib/auth/client.ts)                 │
│         createClient(url, anonKey, config)           │
└─────────────────────────────────────────────────────┘
```

## 🗂️ File Structure

```
src/
├── lib/              # TEMPLATE CORE - always keep
│   ├── auth/         # Authentication layer
│   ├── database/     # Database operations
│   ├── storage/      # File storage operations
│   ├── query/        # Smart Query layer (TanStack Query)
│   ├── utils/        # Error handling, validation, formatting
│   ├── constants/    # Configuration constants
│   └── index.ts      # Master barrel export
├── providers/        # TEMPLATE CORE - React providers
│   ├── QueryProvider.tsx
│   └── SupabaseProvider.tsx
├── hooks/            # TEMPLATE CORE - Generic hooks
│   ├── useSupabase.ts
│   └── useAuth.tsx
├── types/            # TEMPLATE CORE - TypeScript types
│   └── database.ts
├── App.tsx           # ❌ DEMO - delete when using as template
├── App.css           # ❌ DEMO - delete when using as template
└── main.tsx          # Entry point - keep but modify
```

## 🚀 Quick Start

1. Install dependencies: `npm install`
2. Copy `.env` and fill in your Supabase credentials
3. Push migrations: `supabase db push`
4. Start dev server: `npm run dev`

## 📋 For Template Users

**Keep:** Everything in `src/lib/`, `src/providers/`, `src/hooks/`, `src/types/`
**Delete:** `src/App.tsx`, `src/App.css`
**Modify:** `src/main.tsx` to use your own App, `src/types/database.ts` with your generated types
