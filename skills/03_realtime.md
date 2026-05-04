# Skill 03: Realtime Subscriptions

## Template Core Files
- `src/lib/database/realtime.ts` - Realtime subscription utilities
- `src/lib/database/teams.ts` - Team-specific realtime (subscribeToTeam)

## Realtime Types

### RealtimeEvent
`'INSERT' | 'UPDATE' | 'DELETE' | '*'` - The type of database change to listen for.

### RealtimeChange<T>
```typescript
interface RealtimeChange<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T | null    // Present for INSERT/UPDATE
  old: T | null    // Present for DELETE/UPDATE
}
```

### SubscriptionConfig
```typescript
interface SubscriptionConfig {
  table: string       // Table to monitor
  event?: RealtimeEvent  // Which events (default: '*')
  filter?: string     // Row-level filter (e.g., 'user_id=eq.abc')
  schema?: string     // Database schema (default: 'public')
}
```

### SubscriptionCallbacks<T>
```typescript
interface SubscriptionCallbacks<T> {
  onInsert?: (data: T) => void
  onUpdate?: (data: T) => void
  onDelete?: (data: T) => void
  onAll?: (change: RealtimeChange<T>) => void
  onError?: (error: Error) => void
}
```

## subscribeToTable<T>(config, callbacks)
Subscribes to postgres_changes events on a table. Returns a RealtimeChannel for cleanup.
```typescript
const channel = subscribeToTable<Todo>(
  { table: 'todos', filter: `user_id=eq.${userId}` },
  {
    onInsert: (data) => console.log('New todo:', data),
    onUpdate: (data) => console.log('Updated todo:', data),
    onDelete: (data) => console.log('Deleted todo:', data),
  }
)

// Cleanup
await supabase.removeChannel(channel)
```

## useSubscription<T>(config, callbacks, options?)
React-friendly wrapper that returns a cleanup function for useEffect.
```typescript
useEffect(() => {
  const cleanup = useSubscription<Todo>(
    { table: 'todos', filter: `user_id=eq.${userId}` },
    { onInsert: handleNewTodo }
  )
  return cleanup
}, [userId])
```

## createBroadcastChannel(name)
Creates a cross-tab communication channel using Supabase broadcast.
```typescript
const channel = createBroadcastChannel('my-app-events')

// Listen
channel.subscribe((payload) => {
  console.log(payload.event, payload.payload)
})

// Send
channel.send('user_action', { type: 'todo_created', data: newTodo })
```

## createPresenceChannel(name)
Creates a presence channel for tracking online users across tabs.
```typescript
const channel = createPresenceChannel('online-users')

channel.subscribe(
  userId,
  { name: 'John', avatar: '...' },
  {
    onSync: (users) => setOnlineUsers(users),
    onJoin: (user) => console.log('Joined:', user),
    onLeave: (user) => console.log('Left:', user),
  }
)

// Cleanup
channel.untrack()
```

## Realtime with Smart Queries
The preferred pattern is to use the realtime hooks from `src/lib/query/hooks.ts` which integrate directly with TanStack Query:
```typescript
// Subscribe and auto-update cache
usePersonalTodosRealtime(userId)
useTeamTodosRealtime(teamId)
useStorageFilesRealtime(userId, teamId)
```

These hooks call `queryClient.setQueryData()` directly on INSERT/UPDATE/DELETE events, so the UI updates instantly without a network refetch.

## Team Realtime
`subscribeToTeam(teamId, callbacks)` subscribes to both team todos AND team member changes simultaneously:
```typescript
const channels = subscribeToTeam(teamId, {
  onTodoInsert: (data) => { ... },
  onTodoUpdate: (data) => { ... },
  onTodoDelete: (data) => { ... },
  onMemberChange: () => { ... },
})

// Cleanup all channels
await unsubscribeFromTeam(channels)
```

## Important Notes
- Each subscription creates a WebSocket connection. Too many channels can hit rate limits.
- Always clean up subscriptions in useEffect cleanup functions.
- Filters use PostgREST syntax: `column=eq.value`, `column=gt.value`, etc.
- Realtime must be enabled on tables in Supabase dashboard or via migrations (PUBLICATION).
