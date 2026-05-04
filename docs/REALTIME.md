# Realtime Guide

## Overview

Supabase Realtime enables live data synchronization between your database and frontend. This template provides three types of realtime: PostgreSQL change subscriptions, cross-tab broadcast channels, and presence tracking.

## Files

| File | Purpose |
|------|---------|
| `src/lib/database/realtime.ts` | Core realtime utilities |
| `src/lib/database/teams.ts` | Team-specific realtime (subscribeToTeam) |
| `src/lib/query/hooks.ts` | Realtime hooks that integrate with TanStack Query |

## Types of Realtime

### 1. PostgreSQL Changes
Listen to INSERT, UPDATE, DELETE events on database tables.

```typescript
import { subscribeToTable, unsubscribe } from './lib/database'

const channel = subscribeToTable<Todo>(
  { table: 'todos', filter: `user_id=eq.${userId}` },
  {
    onInsert: (data) => console.log('New todo:', data),
    onUpdate: (data) => console.log('Updated:', data),
    onDelete: (data) => console.log('Deleted:', data),
    onAll: (change) => console.log('Any change:', change.eventType),
    onError: (error) => console.error('Realtime error:', error),
  }
)

// Cleanup when done
await unsubscribe(channel)
```

### 2. Broadcast Channels
Cross-tab communication for custom events.

```typescript
import { createBroadcastChannel } from './lib/database'

const channel = createBroadcastChannel('my-app-events')

// Listen
channel.subscribe((payload) => {
  console.log(payload.event, payload.payload)
})

// Send
channel.send('user_action', { type: 'todo_created', data: todo })
```

### 3. Presence Channels
Track online users across tabs.

```typescript
import { createPresenceChannel } from './lib/database'

const channel = createPresenceChannel('online-users')

channel.subscribe(
  userId,
  { name: 'John', avatar: '...' },
  {
    onSync: (users) => setOnlineUsers(users),
    onJoin: (user) => console.log('User joined:', user),
    onLeave: (user) => console.log('User left:', user),
  }
)

// Cleanup
await channel.untrack()
```

## Smart Query Realtime Hooks (Recommended)

The preferred pattern integrates realtime with TanStack Query for automatic cache updates:

```typescript
import {
  usePersonalTodosRealtime,
  useTeamTodosRealtime,
  useStorageFilesRealtime,
} from './lib/query'

function MyComponent({ userId, teamId }: { userId: string; teamId: string | null }) {
  // Subscribe and auto-update cache
  usePersonalTodosRealtime(userId)
  useTeamTodosRealtime(teamId)
  useStorageFilesRealtime(userId, teamId)

  // Your queries automatically receive updates
  const { data: todos } = usePersonalTodos(userId)
  // When another tab creates/updates/deletes a todo, this data updates instantly
}
```

### How It Works
1. The realtime hook subscribes to postgres_changes on the table
2. When an INSERT/UPDATE/DELETE event occurs, the callback calls `queryClient.setQueryData()`
3. The cache is updated directly - no network request needed
4. React re-renders components using that query key

## Team Realtime

Subscribe to both team todos and member changes:

```typescript
import { subscribeToTeam, unsubscribeFromTeam } from './lib/database'

const channels = subscribeToTeam(teamId, {
  onTodoInsert: (data) => {
    // New team todo
  },
  onTodoUpdate: (data) => {
    // Updated team todo
  },
  onTodoDelete: (data) => {
    // Deleted team todo
  },
  onMemberChange: () => {
    // Team member added/removed/promoted
  },
})

// Cleanup all channels
await unsubscribeFromTeam(channels)
```

## React Integration

### Manual Subscription Pattern
```typescript
import { useEffect, useRef } from 'react'
import { subscribeToTable, unsubscribe } from './lib/database'

function useTodosRealtime(userId: string) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const channel = subscribeToTable<Todo>(
      { table: 'todos', filter: `user_id=eq.${userId}` },
      { onInsert: handleInsert, onUpdate: handleUpdate, onDelete: handleDelete }
    )
    channelRef.current = channel
    return () => { if (channelRef.current) unsubscribe(channelRef.current) }
  }, [userId])
}
```

### With Smart Queries (Simpler)
```typescript
function useTodosRealtime(userId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = subscribeToTable<Todo>(
      { table: 'todos', filter: `user_id=eq.${userId}` },
      {
        onInsert: (data) => queryClient.setQueryData(['todos', userId], (old) => old ? [data, ...old] : [data]),
        onUpdate: (data) => queryClient.setQueryData(['todos', userId], (old) => old ? old.map(t => t.id === data.id ? data : t) : old),
        onDelete: (data) => queryClient.setQueryData(['todos', userId], (old) => old ? old.filter(t => t.id !== data.id) : old),
      }
    )
    return () => supabase.removeChannel(channel)
  }, [userId, queryClient])
}
```

## Realtime Configuration

### Enable Realtime on Tables
Tables must be added to the `supabase_realtime` publication:

```sql
-- In migration or SQL editor
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
ALTER PUBLICATION supabase_realtime ADD TABLE storage_files;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE team_members;
```

### Check Enabled Tables
```sql
SELECT * FROM pg_publication_tables;
```

## Best Practices

1. **Always clean up subscriptions** - Use useEffect cleanup functions
2. **Use filters** - Don't subscribe to entire tables; filter by user_id or team_id
3. **Limit subscriptions** - Too many channels can hit WebSocket limits
4. **Use smart query realtime hooks** - They handle cache updates and cleanup automatically
5. **RLS applies to realtime** - Users only receive events for rows they can SELECT
