# Smart Query Layer - Complete Reference

> This is the PRIMARY data access layer of the template. All components should use smart query hooks instead of raw database operations.

## Overview

The smart query layer (`src/lib/query/`) wraps the database operations layer with **TanStack Query** to provide:
- **Automatic caching** - Data is cached with configurable stale times
- **Background refetching** - Stale data is refetched automatically
- **Optimistic UI updates** - Mutations update the UI before server confirms
- **Realtime cache sync** - Database changes update the cache instantly
- **Hierarchical invalidation** - Invalidate related caches with one call

## Architecture

```
Component
  ↓ uses
Smart Hook (usePersonalTodos, useCreateTodo, etc.)
  ↓ wraps
TanStack Query (useQuery, useMutation)
  ↓ calls
Database Operation (fetchAll, insertOne, etc.)
  ↓ uses
Supabase Client
```

## Files

### `src/lib/query/client.ts` - QueryClient Configuration
```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,    // 5 minutes before data is "stale"
      gcTime: 1000 * 60 * 30,      // 30 minutes before garbage collection
      retry: 2,                     // Retry failed requests 2 times
      refetchOnWindowFocus: false,  // Don't refetch when user returns to tab
    },
    mutations: {
      retry: 1,                     // Retry failed mutations once
    },
  },
})
```

### `src/lib/query/keys.ts` - Query Key Factory

**Purpose:** Centralized, type-safe query keys for cache management.

**Structure:** Hierarchical keys that allow targeted invalidation.

```typescript
// Full key hierarchy
queryKeys.all                              // ['supabase']
  ├── queryKeys.todos.all                  // ['supabase', 'todos']
  │     ├── queryKeys.todos.personal(userId)  // ['supabase', 'todos', 'personal', userId]
  │     ├── queryKeys.todos.team(teamId)      // ['supabase', 'todos', 'team', teamId]
  │     └── queryKeys.todos.detail(id)        // ['supabase', 'todos', 'detail', id]
  ├── queryKeys.teams.all                  // ['supabase', 'teams']
  │     ├── queryKeys.teams.user(userId)      // ['supabase', 'teams', 'user', userId]
  │     └── queryKeys.teams.detail(teamId)    // ['supabase', 'teams', 'detail', teamId]
  ├── queryKeys.teamMembers.all            // ['supabase', 'team-members']
  │     └── queryKeys.teamMembers.byTeam(teamId) // ['supabase', 'team-members', teamId]
  └── queryKeys.storageFiles.all           // ['supabase', 'storage-files']
        ├── queryKeys.storageFiles.personal(userId) // ['supabase', 'storage-files', 'personal', userId]
        └── queryKeys.storageFiles.team(teamId)     // ['supabase', 'storage-files', 'team', teamId]
```

### Invalidation Helpers

| Helper | What It Invalidates | Use When |
|--------|-------------------|----------|
| `invalidate.todos('personal', userId)` | Personal todos for user | Creating/updating/deleting personal todo |
| `invalidate.todos('team', teamId)` | Team todos for team | Creating/updating/deleting team todo |
| `invalidate.todosAll()` | All todo caches | Bulk todo operations |
| `invalidate.teams(userId)` | User's team list | Creating/leaving a team |
| `invalidate.teamsAll()` | All team caches | Any team change |
| `invalidate.teamMembers(teamId)` | Team member list | Adding/removing/promoting members |
| `invalidate.storageFiles('personal', userId)` | Personal file list | Uploading/deleting personal file |
| `invalidate.storageFiles('team', teamId)` | Team file list | Uploading/deleting team file |
| `invalidate.storageFilesAll()` | All file caches | Any file operation |

## Smart Query Hooks

### How to Create a New Smart Hook for Your Table

For any table (e.g., `posts`), you need 4 hooks:

#### 1. Query Hook (Read)
```typescript
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
```

#### 2. Create Mutation Hook
```typescript
export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ title, content, userId }: { title: string; content: string; userId: string }) => {
      return insertOne<Post>('posts', { title, content, user_id: userId })
    },
    onSuccess: (newPost) => {
      queryClient.setQueryData(['supabase', 'posts', newPost.user_id], (old: Post[] | undefined) =>
        old ? [newPost, ...old] : [newPost]
      )
    },
  })
}
```

#### 3. Update Mutation Hook
```typescript
export function useUpdatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Post> }) => {
      return updateById<Post>('posts', id, data)
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['supabase', 'posts', updated.user_id], (old: Post[] | undefined) =>
        old ? old.map(p => p.id === updated.id ? updated : p) : old
      )
    },
  })
}
```

#### 4. Delete Mutation Hook
```typescript
export function useDeletePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      await deleteById('posts', id)
      return { id, userId }
    },
    onSuccess: (_, vars) => {
      queryClient.setQueryData(['supabase', 'posts', vars.userId], (old: Post[] | undefined) =>
        old ? old.filter(p => p.id !== vars.id) : old
      )
    },
  })
}
```

#### 5. Realtime Hook (Optional)
```typescript
export function usePostsRealtime(userId: string | undefined) {
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!userId) return
    const channel = subscribeToTable<Post>(
      { table: 'posts', filter: `user_id=eq.${userId}` },
      {
        onInsert: (data) => {
          queryClient.setQueryData(['supabase', 'posts', userId], (old: Post[] | undefined) =>
            old ? [data, ...old] : [data]
          )
        },
        onUpdate: (data) => {
          queryClient.setQueryData(['supabase', 'posts', userId], (old: Post[] | undefined) =>
            old ? old.map(p => p.id === data.id ? data : p) : old
          )
        },
        onDelete: (data) => {
          queryClient.setQueryData(['supabase', 'posts', userId], (old: Post[] | undefined) =>
            old ? old.filter(p => p.id !== data.id) : old
          )
        },
      }
    )
    channelRef.current = channel
    return () => { if (channelRef.current) unsubscribe(channelRef.current) }
  }, [userId, queryClient])
}
```

## Usage in Components

### Basic Usage
```typescript
import { usePersonalTodos, useCreateTodo, useToggleTodo, useDeleteTodo, usePersonalTodosRealtime } from './lib/query'

function TodoList({ userId }: { userId: string }) {
  // Read data (auto-cached)
  const { data: todos = [], isLoading, error } = usePersonalTodos(userId)

  // Subscribe to realtime (auto-updates cache)
  usePersonalTodosRealtime(userId)

  // Mutations
  const createTodo = useCreateTodo()
  const toggleTodo = useToggleTodo()
  const deleteTodo = useDeleteTodo()

  if (isLoading) return <Loading />
  if (error) return <Error message={error.message} />

  return (
    <div>
      {todos.map(todo => (
        <div key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo.mutate({ id: todo.id, completed: todo.completed })}
          />
          <span>{todo.title}</span>
          <button onClick={() => deleteTodo.mutate({ id: todo.id, userId })}>Delete</button>
        </div>
      ))}
      <button onClick={() => createTodo.mutateAsync({ title: 'New todo', userId })}>
        Add Todo
      </button>
    </div>
  )
}
```

### With Teams
```typescript
function TeamView({ userId, teamId }: { userId: string; teamId: string | null }) {
  const isPersonal = !teamId

  // Switch between personal and team data
  const { data: personalTodos } = usePersonalTodos(userId)
  const { data: teamTodos } = useTeamTodos(teamId)
  const todos = isPersonal ? personalTodos : teamTodos

  // Realtime for both contexts
  usePersonalTodosRealtime(userId)
  useTeamTodosRealtime(teamId)

  // Create todo adapts to context
  const createTodo = useCreateTodo()
  const handleAdd = async (title: string) => {
    await createTodo.mutateAsync({ title, userId, teamId })
  }
}
```

## Cache Behavior

### When Data Is Fetched
1. **First call**: Fetches from server, stores in cache
2. **Second call within staleTime (5 min)**: Returns cached data (no network request)
3. **After staleTime**: Returns cached data + refetches in background
4. **After gcTime (30 min) of no observers**: Cache is garbage collected

### When Data Is Updated
1. **Mutation onSuccess**: Updates cache directly via `setQueryData`
2. **Realtime event**: Updates cache directly via `setQueryData`
3. **Invalidation**: Marks cache as stale, triggers background refetch

### Manual Cache Control
```typescript
const queryClient = useQueryClient()

// Get cached data
const todos = queryClient.getQueryData(queryKeys.todos.personal(userId))

// Set cached data
queryClient.setQueryData(queryKeys.todos.personal(userId), newTodos)

// Invalidate (mark stale, refetch)
queryClient.invalidateQueries({ queryKey: queryKeys.todos.personal(userId) })

// Refetch immediately
queryClient.refetchQueries({ queryKey: queryKeys.todos.personal(userId) })

// Remove from cache entirely
queryClient.removeQueries({ queryKey: queryKeys.todos.personal(userId) })
```

## Provider Setup

Wrap your app with the QueryProvider:
```typescript
// src/main.tsx
import { QueryProvider } from './providers/QueryProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  </StrictMode>,
)
```
