# Skill 07: Hooks Patterns

## Two Hook Systems

This template provides TWO hook systems for data access. Both are part of the TEMPLATE core.

### System 1: Smart Query Hooks (RECOMMENDED)
Location: `src/lib/query/hooks.ts`
Technology: TanStack Query (React Query)
Features: Automatic caching, background refetching, optimistic updates, realtime cache sync

### System 2: Generic Hooks (Alternative)
Location: `src/hooks/useSupabase.ts` + `src/hooks/useAuth.tsx`
Technology: React useState + useEffect
Features: Manual state management, flexible for custom patterns

## Smart Query Hooks (src/lib/query/hooks.ts)

### Pattern: Query Hook
```typescript
export function usePersonalTodos(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.todos.personal(userId || ''),
    queryFn: async () => {
      if (!userId) return []
      return fetchAll<Todo>('todos', {
        filter: (q) => q.eq('user_id', userId).is('team_id', null),
        order: { column: 'created_at', ascending: false },
      })
    },
    enabled: !!userId,  // Only fetch when userId exists
  })
}
```

**Usage:**
```typescript
const { data = [], isLoading, error, refetch } = usePersonalTodos(user?.id)
```

### Pattern: Mutation Hook
```typescript
export function useCreateTodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ title, userId, teamId }) => {
      return insertOne<Todo>('todos', {
        title, completed: false, user_id: userId, team_id: teamId || null,
      })
    },
    onSuccess: (newTodo) => {
      // Optimistically update cache
      if (newTodo.team_id) {
        queryClient.setQueryData(queryKeys.todos.team(newTodo.team_id), (old) =>
          old ? [newTodo, ...old] : [newTodo]
        )
      } else {
        queryClient.setQueryData(queryKeys.todos.personal(newTodo.user_id), (old) =>
          old ? [newTodo, ...old] : [newTodo]
        )
      }
    },
  })
}
```

**Usage:**
```typescript
const createTodo = useCreateTodo()
await createTodo.mutateAsync({ title: 'New task', userId: user.id })
// Cache is automatically updated, UI re-renders instantly
```

### Pattern: Realtime Hook
```typescript
export function usePersonalTodosRealtime(userId: string | undefined) {
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!userId) return
    const channel = subscribeToTable<Todo>(
      { table: 'todos', filter: `user_id=eq.${userId}` },
      {
        onInsert: (data) => {
          if (!data.team_id) {
            queryClient.setQueryData(queryKeys.todos.personal(userId), (old) =>
              old ? [data, ...old] : [data]
            )
          }
        },
        onUpdate: (data) => { /* update cache */ },
        onDelete: (data) => { /* remove from cache */ },
      }
    )
    channelRef.current = channel
    return () => { if (channelRef.current) unsubscribe(channelRef.current) }
  }, [userId, queryClient])
}
```

**Usage:**
```typescript
// Just call it in your component - it manages its own lifecycle
usePersonalTodosRealtime(user?.id)
```

## Generic Hooks (src/hooks/useSupabase.ts)

### useFetch<T>(table, options?)
useState-based data fetching with manual refetch.
```typescript
const { data, loading, error, refetch, setData } = useFetch<Todo>('todos', {
  filter: (q) => q.eq('user_id', userId),
  order: { column: 'created_at', ascending: false },
})
```

### useLiveQuery<T>(table, options?)
Combines useFetch + useRealtime for automatic live data.
```typescript
const { data, loading, error, refetch } = useLiveQuery<Todo>('todos', {
  filter: (q) => q.eq('user_id', userId),
})
// Data auto-updates when database changes
```

### usePagination<T>(table, options?)
Paginated data with load-more navigation.
```typescript
const { data, loading, page, totalPages, nextPage, prevPage, goToPage, refresh } = usePagination<Post>('posts', {
  pageSize: 10,
  order: { column: 'created_at', ascending: false },
})
```

### useOptimisticUpdate<T>(table, initialData?)
Optimistic UI with rollback on failure.
```typescript
const { data, optimisticInsert, optimisticUpdate, optimisticDelete } = useOptimisticUpdate<Todo>('todos', initialTodos)

await optimisticInsert(
  { title: 'New task' },
  () => insertOne('todos', { title: 'New task', user_id: userId })
)
// If server fails, UI rolls back automatically
```

### useSearch<T>(table, column, options?)
Debounced search (default 300ms delay).
```typescript
const { query, setQuery, data, loading, error } = useSearch<Todo>('todos', 'title', { limit: 20 })
// Type in search box → 300ms delay → query executes
```

## Auth Hooks (src/hooks/useAuth.tsx)

### AuthProvider + useAuth()
Context-based auth state management.
```typescript
// Wrap your app
<AuthProvider>
  <App />
</AuthProvider>

// Use anywhere
const { user, loading, signIn, signOut, isAuthenticated } = useAuth()
```

### useRequireAuth(redirectTo?)
Protects routes - redirects if not authenticated.
```typescript
const { isAuthenticated, loading } = useRequireAuth('/login')
if (loading) return <Loading />
if (!isAuthenticated) return null // Redirect happens in hook
```

### useSession()
Session management with expiration warnings.
```typescript
const { session, user, isExpiring, refresh, expiresAt } = useSession()
// isExpiring becomes true when session expires within 5 minutes
```

## When to Use Which System

| Use Case | Smart Query Hooks | Generic Hooks |
|----------|------------------|---------------|
| New project | ✅ Primary choice | Alternative |
| Complex caching | ✅ Built-in | Manual |
| Realtime sync | ✅ Direct cache update | useLiveQuery |
| Optimistic updates | ✅ Via mutations | useOptimisticUpdate |
| Simple one-off fetch | Overkill | useFetch |
| Custom state logic | Possible | More flexible |
