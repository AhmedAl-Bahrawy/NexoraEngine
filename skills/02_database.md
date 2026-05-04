# 02 — Database (CRUD, Filters, Joins)

**Source files:**
- `src/lib/database/queries.ts` — SELECT operations
- `src/lib/database/mutations.ts` — INSERT, UPDATE, DELETE
- `src/lib/database/realtime.ts` — live subscriptions
- `src/lib/database/index.ts` — re-exports everything

---

## 🗄️ Pattern: Fetch All Rows

```ts
import { fetchAll } from '@/lib/database';

const { data, error } = await fetchAll('spaces');
```

---

## 🗄️ Pattern: Fetch with Filters

```ts
import { supabase } from '@/lib/database/client';

const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('status', 'done')
  .order('created_at', { ascending: false });
```

---

## 🗄️ Pattern: Fetch a Single Row by ID

```ts
const { data, error } = await supabase
  .from('spaces')
  .select('*')
  .eq('id', spaceId)
  .single(); // throws if not exactly 1 row
```

---

## 🗄️ Pattern: Insert One Row

```ts
import { insertOne } from '@/lib/database';

const newSpace = await insertOne('spaces', {
  name: 'My Space',
  owner_id: user.id,
});
```

---

## 🗄️ Pattern: Update a Row

```ts
import { supabase } from '@/lib/database/client';

const { error } = await supabase
  .from('tasks')
  .update({ status: 'done' })
  .eq('id', taskId);
```

---

## 🗄️ Pattern: Delete a Row

```ts
const { error } = await supabase
  .from('tasks')
  .delete()
  .eq('id', taskId);
```

---

## 🗄️ Pattern: Join Related Tables

```ts
// Get spaces with their boards (foreign key: boards.space_id)
const { data } = await supabase
  .from('spaces')
  .select(`
    id,
    name,
    boards (
      id,
      title
    )
  `);
```

---

## 🗄️ Pattern: Pagination

```ts
const PAGE_SIZE = 20;
const page = 0; // increment for next page

const { data } = await supabase
  .from('tasks')
  .select('*')
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
```

---

## 🗄️ Pattern: Count Rows

```ts
const { count } = await supabase
  .from('tasks')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'done');
```

---

## ⚠️ Gotchas

- `.single()` throws a **406 error** if 0 or 2+ rows are returned — use `.maybeSingle()` if the row might not exist.
- RLS (Row Level Security) blocks queries silently — if data is empty and there's no error, check your RLS policies (`skills/05_rls_policies.md`).
- Always `await` mutations and check for `error` before using `data`.
