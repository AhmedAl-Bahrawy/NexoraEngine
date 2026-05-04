# 07 — React Hooks Patterns

This project's custom hooks live in `src/hooks/`.
Use these instead of writing raw Supabase calls in components.

---

## 🪝 `useAuth` — Authentication State

**File:** `src/hooks/useAuth.tsx`

```tsx
import { useAuth } from '@/hooks/useAuth';

const {
  user,         // The current Supabase User object (null if not logged in)
  session,      // The full session object
  loading,      // true while auth state is initializing
  signOut,      // function to sign out
} = useAuth();
```

**When to use:** Any component that needs to know if the user is logged in, or needs the `user.id`.

---

## 🪝 `useLiveQuery` — Data + Realtime Together

**File:** `src/hooks/useSupabase.ts`

```tsx
import { useLiveQuery } from '@/hooks/useSupabase';

const { data, loading, error } = useLiveQuery('tasks', {
  filters: { board_id: boardId },  // optional WHERE filters
  orderBy: 'created_at',           // optional ORDER BY
});
```

**When to use:** Any list that should update in real-time (tasks, messages, boards).

---

## 🪝 Pattern: Build a Custom Hook for a Feature

When you have complex fetching logic, extract it into a hook.

```tsx
// src/hooks/useBoardTasks.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/database/client';

export function useBoardTasks(boardId: string) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!boardId) return;

    // Fetch initial data
    supabase
      .from('tasks')
      .select('*')
      .eq('board_id', boardId)
      .then(({ data }) => {
        setTasks(data ?? []);
        setLoading(false);
      });

    // Subscribe to changes
    const channel = supabase
      .channel(`tasks-${boardId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `board_id=eq.${boardId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') setTasks(p => [...p, payload.new]);
        if (payload.eventType === 'UPDATE') setTasks(p => p.map(t => t.id === payload.new.id ? payload.new : t));
        if (payload.eventType === 'DELETE') setTasks(p => p.filter(t => t.id !== payload.old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [boardId]);

  return { tasks, loading };
}
```

---

## 🪝 Pattern: Mutation Hook (with loading/error state)

```tsx
// src/hooks/useCreateTask.ts
import { useState } from 'react';
import { insertOne } from '@/lib/database';

export function useCreateTask() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createTask(taskData: object) {
    setLoading(true);
    setError(null);
    try {
      const result = await insertOne('tasks', taskData);
      return result;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return { createTask, loading, error };
}
```

Usage:
```tsx
const { createTask, loading } = useCreateTask();
<button onClick={() => createTask({ title: 'New Task', board_id: id })} disabled={loading}>
  Add Task
</button>
```

---

## ⚠️ Gotchas

- Hooks must be called at the **top level** of a component, never inside conditions or loops.
- Always include cleanup (`return () => ...`) in `useEffect` when subscribing to channels.
- `useLiveQuery` already handles cleanup internally — don't double-subscribe.
