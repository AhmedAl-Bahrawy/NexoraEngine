# 03 — Realtime (Live Subscriptions)

**Source files:**
- `src/lib/database/realtime.ts` — raw channel subscriptions
- `src/hooks/useSupabase.ts` — `useLiveQuery` hook

---

## ⚡ Pattern: useLiveQuery (Recommended)

Use this hook for any list that should update automatically without a page refresh.

```tsx
import { useLiveQuery } from '@/hooks/useSupabase';

function TaskList({ boardId }: { boardId: string }) {
  const { data: tasks, loading } = useLiveQuery('tasks', {
    filters: { board_id: boardId },
  });

  if (loading) return <Spinner />;
  return <ul>{tasks.map(t => <li key={t.id}>{t.title}</li>)}</ul>;
}
```

---

## ⚡ Pattern: Manual Channel Subscription

For fine-grained control (e.g. only listen to INSERT events):

```ts
import { supabase } from '@/lib/database/client';

const channel = supabase
  .channel('tasks-changes')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'tasks' },
    (payload) => {
      console.log('New task:', payload.new);
      setTasks(prev => [...prev, payload.new]);
    }
  )
  .subscribe();

// IMPORTANT: Clean up when component unmounts
return () => { supabase.removeChannel(channel); };
```

---

## ⚡ Pattern: Listen to ALL changes (INSERT + UPDATE + DELETE)

```ts
const channel = supabase
  .channel('all-tasks')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'tasks' },
    (payload) => {
      if (payload.eventType === 'INSERT') { /* add item */ }
      if (payload.eventType === 'UPDATE') { /* update item */ }
      if (payload.eventType === 'DELETE') { /* remove item by payload.old.id */ }
    }
  )
  .subscribe();
```

---

## ⚡ Pattern: Filter Subscription to One Row's Changes

```ts
// Only listen for changes to tasks in board X
.on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'tasks',
  filter: `board_id=eq.${boardId}`,
}, handler)
```

---

## ⚡ Pattern: Presence (Who is Online)

```ts
const channel = supabase.channel('online-users');

channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    console.log('Online users:', Object.keys(state));
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
    }
  });
```

---

## ⚠️ Gotchas

- **Always unsubscribe** in the `useEffect` cleanup — forgetting causes memory leaks and duplicate events.
- Realtime requires the table to have **Replication enabled** in Supabase Dashboard → Database → Replication.
- RLS applies to realtime too — if a subscription returns nothing, check the RLS policy for SELECT.
- Channel names must be **unique per client** — use a specific name like `'tasks-board-${boardId}'` instead of just `'tasks'`.
