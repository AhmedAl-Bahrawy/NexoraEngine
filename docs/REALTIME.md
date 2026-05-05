# Realtime System

Nexora Engine provides a comprehensive realtime system built on Supabase Realtime, offering database change subscriptions, broadcast messaging, presence tracking, and connection management.

## Architecture

```
┌─────────────────────────────────────────┐
│          Application Layer              │
│  (React, Vue, Angular, etc.)           │
├─────────────────────────────────────────┤
│        Nexora Realtime Layer            │
│  RealtimeManager, Channel Handles       │
├──────────────┬──────────────┬───────────┤
│  Database    │  Broadcast   │ Presence  │
│  Changes     │  Channels    │ Channels  │
├──────────────┴──────────────┴───────────┤
│        Supabase Realtime (WebSocket)    │
└─────────────────────────────────────────┘
```

## Database Change Subscriptions

### subscribeToTable

Subscribe to database changes on an entire table.

```typescript
import { subscribeToTable, type RealtimeChange } from 'nexora-engine'

const handle = subscribeToTable<User>(
  {
    table: 'users',
    event: '*',           // 'INSERT' | 'UPDATE' | 'DELETE' | '*'
    schema: 'public',     // Database schema (default: 'public')
    filter: '',           // Optional filter: "status=eq.active"
    channelName: '',      // Custom channel name (optional)
    timeout: 30000,       // Subscription timeout in ms (default: 30000)
  },
  {
    onInsert: (data) => { /* New row inserted */ },
    onUpdate: (data) => { /* Row updated */ },
    onDelete: (data) => { /* Row deleted */ },
    onAll: (change: RealtimeChange<User>) => {
      console.log(change.eventType) // 'INSERT' | 'UPDATE' | 'DELETE'
      console.log(change.new)       // New row data (null for DELETE)
      console.log(change.old)       // Old row data (null for INSERT)
      console.log(change.schema)    // Database schema
      console.log(change.table)     // Table name
      console.log(change.commitTimestamp) // When the change was committed
    },
    onSubscribed: (info) => { /* Connection established */ },
    onTimedOut: () => { /* Subscription timed out */ },
    onClosed: () => { /* Subscription closed */ },
    onError: (error) => { /* Error occurred */ },
  }
)

// Check subscription status
handle.isSubscribed() // boolean - is currently subscribed
handle.getState()     // 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED' | 'CONNECTING'

// Unsubscribe
await handle.unsubscribe()
```

### subscribeToRow

Subscribe to changes on a specific row only. This is more efficient than subscribing to an entire table when you only care about one record.

```typescript
import { subscribeToRow } from 'nexora-engine'

const handle = subscribeToRow<User>(
  'users',
  'user-123',         // Row ID to watch
  {
    onUpdate: (data) => console.log('User updated:', data),
    onAll: (change) => console.log(change.eventType, change.new),
  },
  {
    schema: 'public',
    events: ['UPDATE'],  // Only listen to UPDATE events
    channelName: 'user-123-watcher',
    timeout: 30000,
  }
)

await handle.unsubscribe()
```

### subscribeToTables

Subscribe to multiple tables with different callbacks per table.

```typescript
import { subscribeToTables } from 'nexora-engine'

const handles = subscribeToTables([
  {
    config: { table: 'users', event: 'INSERT' },
    callbacks: {
      onInsert: (data) => console.log('New user:', data),
    },
  },
  {
    config: { table: 'posts', event: '*' },
    callbacks: {
      onInsert: (data) => console.log('New post:', data),
      onUpdate: (data) => console.log('Post updated:', data),
      onDelete: (data) => console.log('Post deleted:', data),
    },
  },
  {
    config: { table: 'comments', event: 'INSERT' },
    callbacks: {
      onInsert: (data) => console.log('New comment:', data),
    },
  },
])

// Unsubscribe all at once
for (const h of handles) {
  await h.unsubscribe()
}
```

### Filter Syntax

Use Supabase's filter syntax in the `filter` config option:

```typescript
// Filter by specific column value
{ filter: 'id=eq.123' }
{ filter: 'status=eq.active' }
{ filter: 'role=in.(admin,moderator)' }

// Combine with event type
{
  table: 'posts',
  event: 'UPDATE',
  filter: 'author_id=eq.user-123',  // Only updates by this author
}
```

## Broadcast Channels

Client-to-client messaging that doesn't involve the database. Perfect for chat, typing indicators, notifications, and collaborative editing.

```typescript
import { createBroadcastChannel } from 'nexora-engine'

const channel = createBroadcastChannel('chat-room-123')

// Register event handlers BEFORE subscribing
channel
  .on('message', (payload, event) => {
    console.log('Message received:', payload)
  })
  .on('typing', (payload, event) => {
    console.log('User is typing:', payload)
  })
  .on('reaction', (payload, event) => {
    console.log('Reaction:', payload)
  })
  .subscribe() // Connect to the broadcast channel

// Send messages
await channel.send('message', {
  text: 'Hello everyone!',
  userId: 'user-123',
  timestamp: Date.now(),
})

await channel.send('typing', {
  userId: 'user-123',
  isTyping: true,
})

// Check state
channel.isSubscribed() // boolean
channel.getState()     // 'SUBSCRIBED' | 'CHANNEL_ERROR' | ...

// Disconnect
await channel.unsubscribe()
```

### BroadcastChannelHandle API

| Method | Description |
|--------|-------------|
| `on(event, callback)` | Register handler for specific event (chainable) |
| `send(event, payload, options?)` | Send a broadcast message |
| `subscribe()` | Connect to the channel |
| `unsubscribe()` | Disconnect and cleanup |
| `getState()` | Get current channel state |
| `isSubscribed()` | Check if currently subscribed |

## Presence Channels

Track who is online in real-time. Perfect for chat rooms, collaborative documents, and live user lists.

```typescript
import { createPresenceChannel } from 'nexora-engine'

const presence = createPresenceChannel('chat-room-123')

// Join the channel and start tracking
const cleanup = await presence.subscribe(
  'user-123',                                  // Unique user ID
  {                                            // User info to share
    name: 'John Doe',
    avatar: '/avatars/john.jpg',
    status: 'online',
  },
  {
    onSync: (users) => {
      // Called when presence state is fully synced
      // users: { 'user-123': [{ userId, name, avatar, status, online_at }], ... }
      console.log('All online users:', users)
    },
    onJoin: (presences) => {
      // Called when new users join
      console.log('Users joined:', presences)
    },
    onLeave: (presences) => {
      // Called when users leave
      console.log('Users left:', presences)
    },
    onSubscribed: () => {
      console.log('Connected to presence channel')
    },
    onError: (error) => {
      console.error('Presence error:', error)
    },
    onTimedOut: () => {
      console.log('Presence subscription timed out')
    },
    onClosed: () => {
      console.log('Presence channel closed')
    },
  }
)

// Get current presence state
const onlineUsers = presence.getState()
// Returns: { 'user-123': [{ ... }], 'user-456': [{ ... }] }

// Get count of online users
const count = presence.getPresenceCount()

// Check if this client is tracking
const tracking = presence.isTracking()

// Leave the channel (untrack + unsubscribe)
await cleanup()

// Or just untrack (stay connected but go invisible)
await presence.untrack()

// Or fully disconnect
await presence.unsubscribe()
```

### PresenceChannelHandle API

| Method | Description |
|--------|-------------|
| `subscribe(userId, userInfo, callbacks)` | Join channel and start tracking |
| `untrack()` | Stop tracking (go invisible) |
| `unsubscribe()` | Disconnect and cleanup |
| `getState()` | Get current presence state |
| `getPresenceCount()` | Get number of online users |
| `isTracking()` | Check if currently tracking |

## Connection Management

### Global Connection State

```typescript
import { 
  getConnectionState,
  onConnectionChange,
  getChannels,
  getSubscribedChannels,
  getChannelInfo,
  getChannelState,
  isChannelActive,
  reconnect,
} from 'nexora-engine'

// Get current connection state
const state = getConnectionState()
// 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

// Listen to connection state changes
const cleanup = onConnectionChange((state) => {
  switch (state) {
    case 'connected':
      console.log('Realtime connected')
      break
    case 'disconnected':
      console.log('Realtime disconnected')
      break
    case 'reconnecting':
      console.log('Realtime reconnecting...')
      break
    case 'connecting':
      console.log('Realtime connecting...')
      break
  }
})

// Call cleanup() when done to remove listener
cleanup()
```

### Channel Management

```typescript
// List all active channels
const channels = getChannels()
// Returns: ChannelInfo[]
// ChannelInfo: { key, channel, type, state, subscribedAt }

// Get only subscribed channels
const active = getSubscribedChannels()

// Check if a specific channel is active
const isActive = isChannelActive('db:public.users:*:')

// Get detailed info about a channel
const info = getChannelInfo('db:public.users:*:')
// Returns: ChannelInfo | undefined

// Get the state of a specific channel
const channelState = getChannelState('db:public.users:*:')
// Returns: 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED' | 'CONNECTING' | undefined

// Reconnect all channels
await reconnect()

// Unsubscribe from ALL channels
await unsubscribeAll()
```

## RealtimeManager

A unified class for managing all realtime operations:

```typescript
import { realtime, RealtimeManager } from 'nexora-engine'

// Use the singleton
const dbHandle = realtime.subscribeToTable({ table: 'posts' }, {
  onInsert: (data) => console.log('New post:', data),
})

const broadcast = realtime.createBroadcastChannel('notifications')
const presence = realtime.createPresenceChannel('room-1')

const state = realtime.getConnectionState()
const channels = realtime.getChannels()
const subscribed = realtime.getSubscribedChannels()

await realtime.reconnect()
await realtime.unsubscribeAll()

// Cleanup when application shuts down
realtime.destroy()
```

## Channel States

Every channel goes through these states:

| State | Description |
|-------|-------------|
| `CONNECTING` | Initial state, establishing connection |
| `SUBSCRIBED` | Successfully connected and receiving events |
| `CHANNEL_ERROR` | Connection failed with an error |
| `TIMED_OUT` | Connection timed out (no response) |
| `CLOSED` | Channel was closed (by server or client) |

## Best Practices

### 1. Always Unsubscribe

Prevent memory leaks by always unsubscribing when done:

```typescript
// In React useEffect
useEffect(() => {
  const handle = subscribeToTable({ table: 'posts' }, {
    onInsert: (data) => setPosts(prev => [...prev, data]),
  })

  return () => {
    handle.unsubscribe()
  }
}, [])
```

### 2. Use Row-Level Subscriptions When Possible

If you only need changes for specific records, use `subscribeToRow` instead of `subscribeToTable`:

```typescript
// BAD: Subscribes to ALL user changes
subscribeToTable({ table: 'users', event: '*' }, callbacks)

// GOOD: Only subscribes to changes for this specific user
subscribeToRow('users', currentUserId, callbacks)
```

### 3. Handle All Channel States

Don't just handle errors - also handle subscribed, timed out, and closed events:

```typescript
subscribeToTable({ table: 'posts' }, {
  onSubscribed: () => setShowLoading(false),
  onTimedOut: () => setRetryCount(prev => prev + 1),
  onClosed: () => setConnectionStatus('disconnected'),
  onError: (error) => setErrorMessage(error.message),
})
```

### 4. Use Broadcast for Non-Database Events

For events that don't involve database changes (typing indicators, cursors, notifications), use broadcast channels:

```typescript
const channel = createBroadcastChannel('document-123')
channel.on('cursor-move', (payload) => updateCursor(payload))
channel.subscribe()

// Send cursor position on mouse move
document.onmousemove = (e) => {
  channel.send('cursor-move', { x: e.clientX, y: e.clientY })
}
```

### 5. Clean Up Presence on Disconnect

Always untrack before unsubscribing from presence channels to ensure other users see you leave:

```typescript
const cleanup = await presence.subscribe(userId, userInfo, callbacks)

// This properly untracks then unsubscribes
await cleanup()
```

### 6. Monitor Connection State

Implement reconnection UI by monitoring connection state:

```typescript
onConnectionChange((state) => {
  if (state === 'disconnected') {
    showToast('Connection lost. Reconnecting...')
  } else if (state === 'connected') {
    showToast('Connection restored')
  }
})
```

## Error Handling

Realtime errors are wrapped in `NexoraError` with specific codes:

```typescript
import { NexoraError } from 'nexora-engine'

subscribeToTable({ table: 'posts' }, {
  onError: (error) => {
    if (error instanceof NexoraError) {
      switch (error.code) {
        case 'realtime_channel_error':
          console.error('Channel error:', error.message)
          break
        case 'realtime_presence_error':
          console.error('Presence error:', error.message)
          break
        default:
          console.error('Unknown realtime error:', error.message)
      }
    }
  },
})
```

## Performance Considerations

1. **Limit subscription scope**: Use filters and row-level subscriptions to minimize data transfer
2. **Batch presence updates**: Don't track with rapidly changing data; use stable user info
3. **Reuse channels**: Subscribe to multiple events on the same channel rather than creating multiple channels
4. **Clean up unused channels**: Unsubscribe when components unmount or pages change
5. **Use broadcast for high-frequency events**: Typing indicators, cursor positions should use broadcast, not database changes
