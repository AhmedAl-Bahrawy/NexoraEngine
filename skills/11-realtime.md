# Skill: Realtime System

## id
`nexora.realtime`

## name
Realtime System

## category
realtime

## description
Nexora Engine's comprehensive realtime system providing database change subscriptions, broadcast messaging, presence tracking, and connection management built on Supabase Realtime.

## intent
### what
Provides a complete realtime layer with database subscriptions (postgres_changes), broadcast channels (client-to-client messaging), presence channels (online user tracking), and connection management utilities. Includes channel state handling, auto-reconnection, row-level filtering, and unified RealtimeManager.

### why
Enables real-time collaboration, live data updates, chat functionality, and presence awareness without managing WebSocket connections directly. The abstraction handles channel lifecycle, state management, error handling, and cleanup automatically.

## inputs
```typescript
// Subscription Configuration
interface SubscriptionConfig {
  table: string
  event?: RealtimeEvent           // 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string                 // Supabase filter: "id=eq.123"
  schema?: string                 // Database schema (default: 'public')
  channelName?: string            // Custom channel name
  timeout?: number                // Subscription timeout in ms
}

// Subscription Callbacks
interface SubscriptionCallbacks<T> {
  onInsert?: (data: T) => void
  onUpdate?: (data: T) => void
  onDelete?: (data: T) => void
  onAll?: (change: RealtimeChange<T>) => void
  onError?: (error: Error) => void
  onSubscribed?: (info: ChannelInfo) => void
  onTimedOut?: () => void
  onClosed?: () => void
}

// RealtimeChange
interface RealtimeChange<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T | null
  old: T | null
  schema: string
  table: string
  commitTimestamp: string
}

// ChannelInfo
interface ChannelInfo {
  key: string
  channel: RealtimeChannel
  type: 'postgres_changes' | 'broadcast' | 'presence'
  state: RealtimeChannelState
  subscribedAt: number | null
}

// Presence Callbacks
interface PresenceCallbacks {
  onSync?: (users: Record<string, unknown[]>) => void
  onJoin?: (presences: Record<string, unknown[]>) => void
  onLeave?: (presences: Record<string, unknown[]>) => void
  onSubscribed?: () => void
  onError?: (error: Error) => void
  onTimedOut?: () => void
  onClosed?: () => void
}
```

## outputs
```typescript
// SubscriptionHandle
interface SubscriptionHandle {
  channel: RealtimeChannel
  unsubscribe: () => Promise<void>
  isSubscribed: () => boolean
  getState: () => RealtimeChannelState
}

// BroadcastChannelHandle
interface BroadcastChannelHandle {
  on: (event, callback) => BroadcastChannelHandle
  send: (event, payload, options?) => Promise<void>
  subscribe: () => BroadcastChannelHandle
  unsubscribe: () => Promise<void>
  getState: () => RealtimeChannelState
  isSubscribed: () => boolean
}

// PresenceChannelHandle
interface PresenceChannelHandle {
  subscribe: (userId, userInfo, callbacks?) => () => Promise<void>
  untrack: () => Promise<void>
  unsubscribe: () => Promise<void>
  getState: () => RealtimePresenceState
  getPresenceCount: () => number
  isTracking: () => boolean
}

// RealtimeManager
class RealtimeManager {
  subscribeToTable(config, callbacks): SubscriptionHandle
  subscribeToRow(table, rowId, callbacks, options?): SubscriptionHandle
  createBroadcastChannel(name): BroadcastChannelHandle
  createPresenceChannel(name): PresenceChannelHandle
  getChannelState(key): RealtimeChannelState | undefined
  getChannels(): ChannelInfo[]
  getSubscribedChannels(): ChannelInfo[]
  getConnectionState(): RealtimeConnectionState
  onConnectionChange(callback): () => void
  unsubscribe(handle): Promise<void>
  unsubscribeAll(): Promise<void>
  reconnect(): Promise<void>
  destroy(): void
}
```

## usage
### steps

#### Database Subscriptions
1. Call `subscribeToTable(config, callbacks)` or `subscribeToRow(table, rowId, callbacks)`
2. Handle events via callbacks (onInsert, onUpdate, onDelete, onAll)
3. Handle lifecycle via onSubscribed, onTimedOut, onClosed, onError
4. Call `handle.unsubscribe()` when done

#### Broadcast Channels
1. Call `createBroadcastChannel(name)`
2. Register event handlers with `.on(event, callback)` BEFORE subscribing
3. Call `.subscribe()` to connect
4. Send messages with `.send(event, payload)`
5. Call `.unsubscribe()` when done

#### Presence Channels
1. Call `createPresenceChannel(name)`
2. Call `.subscribe(userId, userInfo, callbacks)` to join and track
3. Handle onSync, onJoin, onLeave events
4. Call the returned cleanup function to leave properly

#### Connection Management
1. Use `getConnectionState()` to check current state
2. Use `onConnectionChange(callback)` to listen for state changes
3. Use `getChannels()` to list all active channels
4. Use `reconnect()` to reconnect all channels
5. Use `unsubscribeAll()` to clean up everything

### code examples
```typescript
import { 
  subscribeToTable,
  subscribeToRow,
  createBroadcastChannel,
  createPresenceChannel,
  getConnectionState,
  onConnectionChange,
  getChannels,
  reconnect,
  unsubscribeAll,
  realtime
} from 'nexora-engine'

// === Database Subscription ===
const handle = subscribeToTable<Post>(
  { table: 'posts', event: 'INSERT' },
  {
    onInsert: (post) => addPostToUI(post),
    onSubscribed: () => console.log('Watching posts'),
    onError: (error) => console.error(error),
  }
)

// === Row-Level Subscription ===
const rowHandle = subscribeToRow<User>(
  'users',
  currentUserId,
  {
    onUpdate: (user) => updateProfileUI(user),
  }
)

// === Broadcast Channel ===
const broadcast = createBroadcastChannel('chat-room')
  .on('message', (payload) => displayMessage(payload))
  .on('typing', (payload) => showTypingIndicator(payload))
  .subscribe()

await broadcast.send('message', { text: 'Hello!', userId: 'user-1' })

// === Presence Channel ===
const presence = createPresenceChannel('chat-room')
const cleanup = await presence.subscribe(
  'user-1',
  { name: 'John', avatar: '/john.jpg' },
  {
    onSync: (users) => updateOnlineUsersList(users),
    onJoin: (users) => showJoinNotification(users),
    onLeave: (users) => showLeaveNotification(users),
  }
)

// === Connection Management ===
const cleanupConn = onConnectionChange((state) => {
  if (state === 'disconnected') showOfflineBanner()
  if (state === 'connected') hideOfflineBanner()
})

// Cleanup
await handle.unsubscribe()
await cleanup()
cleanupConn()
await unsubscribeAll()
```

## logic
### internal flow

#### Database Subscriptions
1. Build unique channel key from schema.table:event:filter
2. Check if channel already exists (deduplication)
3. Create Supabase channel with postgres_changes listener
4. Subscribe with timeout, track state transitions
5. Route events to appropriate callbacks (onInsert/onUpdate/onDelete/onAll)
6. Update connection state based on subscription status
7. Track channel in activeChannels map with metadata

#### Broadcast Channels
1. Create Supabase channel with broadcast config
2. Register event handlers via .on() method (stored in Map)
3. On .subscribe(), register all handlers with Supabase
4. On .send(), transmit via channel.send({ type: 'broadcast', event, payload })
5. On .unsubscribe(), cleanup all handlers and remove channel

#### Presence Channels
1. Create Supabase channel with presence config
2. On .subscribe(), register sync/join/leave handlers
3. Subscribe to channel, then track user on SUBSCRIBED
4. Presence events automatically fire sync/join/leave callbacks
5. On cleanup, untrack first then unsubscribe (proper leave sequence)

#### Connection Management
1. Global connectionState tracked across all channels
2. Connection listeners notified on state changes
3. getChannels() returns info from activeChannels map
4. reconnect() iterates all channels and re-subscribes
5. unsubscribeAll() unsubscribes all channels, clears map, disconnects

### execution reasoning
- Channel deduplication prevents multiple subscriptions to same table/event/filter
- State tracking enables UI to show connection status and handle errors gracefully
- Proper untrack before unsubscribe ensures presence data is cleaned up
- Broadcast event handlers registered before subscribe prevents missed messages
- Connection state aggregated from individual channel states

## constraints
### rules
- Always call .unsubscribe() when done to prevent memory leaks
- Register broadcast .on() handlers BEFORE calling .subscribe()
- For presence, always use the returned cleanup function for proper untrack + unsubscribe
- Row-level subscriptions use filter syntax: "id=eq.{rowId}"
- Channel names should be unique across your application
- Timeout is in milliseconds (default: 30000)

### anti-patterns
- Don't subscribe to entire tables when you only need specific rows
- Don't forget to handle onTimedOut and onClosed states
- Don't use database subscriptions for high-frequency events (use broadcast instead)
- Don't skip untrack before presence unsubscribe (causes stale presence data)
- Don't create new channels for every message (reuse channels)
- Don't ignore connection state changes (implement reconnection handling)

## dependencies
### internal SDK modules
- `getClient` (from `./core/client`)
- `NexoraError` (from `./errors/nexora-error`)
- `REALTIME` constants (from `./constants/supabase`)

### external libraries
- `@supabase/supabase-js` (RealtimeChannel, RealtimePostgresChangesPayload, RealtimePresenceState)

## code_mapping
```typescript
// Database Subscriptions
subscribeToTable(config, callbacks)  -> Creates Supabase channel with postgres_changes
subscribeToRow(table, id, callbacks) -> subscribeToTable with filter: "id=eq.{id}"
subscribeToTables(subscriptions)     -> Maps to multiple subscribeToTable calls

// Broadcast
createBroadcastChannel(name)         -> BroadcastChannelHandle
channel.on(event, callback)          -> Registers broadcast handler
channel.send(event, payload)         -> channel.send({ type: 'broadcast', ... })
channel.subscribe()                  -> channel.subscribe()

// Presence
createPresenceChannel(name)          -> PresenceChannelHandle
presence.subscribe(userId, info, cb) -> channel.track() + subscribe
presence.untrack()                   -> channel.untrack()
presence.unsubscribe()               -> untrack + unsubscribe + removeChannel

// Connection
getConnectionState()                 -> Returns global connection state
onConnectionChange(callback)         -> Adds listener, returns cleanup
getChannels()                        -> Returns activeChannels values
getSubscribedChannels()              -> Filters for SUBSCRIBED state
reconnect()                          -> Re-subscribes all channels
unsubscribeAll()                     -> Unsubscribes all, clears map
```

## ai_instructions
### when to use
- Use database subscriptions for CRUD event notifications (new posts, updated profiles, deleted items)
- Use row-level subscriptions for watching specific records (own profile, single document)
- Use broadcast channels for chat, typing indicators, notifications, collaborative cursors
- Use presence channels for online user lists, chat room participants, collaborative editing
- Use connection management for reconnection UI, offline detection, channel debugging
- Use RealtimeManager for centralized realtime control in larger applications

### when NOT to use
- Don't use database subscriptions for high-frequency events (>10/sec) - use broadcast
- Don't use presence for non-interactive tracking (use database flags instead)
- Don't create separate channels for each user in a large group - use one channel with filters
- Don't use broadcast for persistent data - use database mutations instead
- Don't ignore connection state - always implement some form of reconnection handling

### reasoning strategy
1. Determine event type: database change → subscribeToTable/Row, messaging → broadcast, user tracking → presence
2. Assess frequency: low frequency → database subscription, high frequency → broadcast
3. Assess scope: all rows → subscribeToTable, specific row → subscribeToRow
4. Assess lifecycle: component-scoped → unsubscribe on unmount, app-scoped → unsubscribe on app shutdown
5. For presence: use cleanup function returned from subscribe(), not direct untrack/unsubscribe

## metadata
- complexity: high
- stability: stable
- sdk_layer: realtime
