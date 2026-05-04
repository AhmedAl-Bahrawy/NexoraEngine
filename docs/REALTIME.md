# Real-time Feature

This project leverages Supabase Realtime to provide instant updates for database changes, presence, and custom broadcasts.

## Features

- **Postgres Changes**: Listen to INSERT, UPDATE, and DELETE events on specific tables.
- **Presence**: Track user online status and shared state.
- **Broadcast**: Send low-latency messages between clients.
- **Channels**: Organize real-time communication into logical channels.

## Usage

### Listening to Database Changes

```typescript
import { subscribeToTable } from '@/lib/database';

const sub = subscribeToTable('messages', (payload) => {
  if (payload.eventType === 'INSERT') {
    console.log('New message:', payload.new);
  }
});
```

### Using Presence

```typescript
import { createPresenceChannel } from '@/lib/database';

const channel = createPresenceChannel('room-1');
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState();
  console.log('Online users:', state);
});
channel.subscribe();
```

### Broadcasting Messages

```typescript
import { createBroadcastChannel } from '@/lib/database';

const channel = createBroadcastChannel('notifications');
channel.send({
  type: 'broadcast',
  event: 'alert',
  payload: { message: 'Hello everyone!' }
});
```

## Best Practices

- Always **unsubscribe** from channels when they are no longer needed (e.g., in `useEffect` cleanup).
- Use unique channel names to avoid collisions.
- Remember that Realtime also respects **RLS Policies** for Postgres changes.
