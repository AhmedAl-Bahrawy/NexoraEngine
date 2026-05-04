# Database Guide

## Overview

The database layer provides a comprehensive set of operations for reading, writing, and managing data in Supabase. It is organized into queries (read), mutations (write), realtime (subscriptions), and teams (multi-tenancy).

## Files

| File | Purpose |
|------|---------|
| `src/lib/database/queries.ts` | All read operations: fetchAll, fetchById, search, pagination, etc. |
| `src/lib/database/mutations.ts` | All write operations: insert, update, delete, upsert, soft delete, etc. |
| `src/lib/database/realtime.ts` | Realtime subscriptions: postgres_changes, broadcast, presence |
| `src/lib/database/teams.ts` | Team management: create, join, manage members, team realtime |
| `src/lib/database/client.ts` | Re-exports the Supabase client |

## Queries (Read Operations)

### fetchAll<T>(table, options?)
The primary read function for fetching records from any table.

```typescript
import { fetchAll } from './lib/database'

// Basic fetch
const todos = await fetchAll<Todo>('todos')

// With filter
const incompleteTodos = await fetchAll<Todo>('todos', {
  filter: (q) => q.eq('completed', false),
})

// With ordering and limit
const recentTodos = await fetchAll<Todo>('todos', {
  order: { column: 'created_at', ascending: false },
  limit: 10,
})

// With complex filter
const userTodos = await fetchAll<Todo>('todos', {
  filter: (q) => q.eq('user_id', userId).is('team_id', null),
  columns: 'id, title, completed, created_at',
  order: { column: 'created_at', ascending: false },
})
```

### fetchById<T>(table, id, options?)
Fetch a single record by ID.

```typescript
const todo = await fetchById<Todo>('todos', todoId)
// Returns null if not found
```

### fetchWhere<T>(table, conditions, options?)
Fetch records matching exact equality conditions.

```typescript
const activeTodos = await fetchWhere<Todo>('todos', {
  user_id: userId,
  completed: false,
})
```

### fetchPaginated<T>(table, options?)
Paginated results with total count.

```typescript
const result = await fetchPaginated<Todo>('todos', {
  page: 1,
  pageSize: 20,
  order: { column: 'created_at', ascending: false },
})
// result.data - array of records
// result.count - total count
// result.page - current page
// result.pageSize - items per page
// result.totalPages - total pages
```

### search<T>(table, column, searchTerm, options?)
Case-insensitive ILIKE search.

```typescript
const results = await search<Todo>('todos', 'title', 'urgent')
// Matches: "urgent task", "This is URGENT", etc.
```

### count(table, options?)
Count records.

```typescript
const total = await count('todos', { filter: (q) => q.eq('completed', false) })
```

### exists(table, conditions)
Check if records exist.

```typescript
const hasTodos = await exists('todos', { user_id: userId })
```

## Mutations (Write Operations)

### insertOne<T>(table, data)
Insert a single record.

```typescript
import { insertOne } from './lib/database'

const newTodo = await insertOne<Todo>('todos', {
  title: 'New task',
  completed: false,
  user_id: userId,
})
```

### insertMany<T>(table, data)
Insert multiple records.

```typescript
const newTodos = await insertMany<Todo>('todos', [
  { title: 'Task 1', user_id: userId },
  { title: 'Task 2', user_id: userId },
])
```

### updateById<T>(table, id, data)
Update a record by ID.

```typescript
const updated = await updateById<Todo>('todos', todoId, { completed: true })
```

### updateWhere<T>(table, conditions, data)
Update matching records.

```typescript
await updateWhere('todos', { user_id: userId, completed: false }, { completed: true })
```

### upsert<T>(table, data, options?)
Insert or update.

```typescript
const result = await upsert<User>('users', { id: userId, full_name: 'New Name' })
```

### deleteById(table, id)
Delete a record.

```typescript
await deleteById('todos', todoId)
```

### deleteWhere(table, conditions)
Delete matching records. Returns count.

```typescript
const deleted = await deleteWhere('todos', { user_id: userId, completed: true })
```

### softDelete<T>(table, id)
Soft delete (sets deleted_at).

```typescript
await softDelete<Todo>('todos', todoId)
```

### restore<T>(table, id)
Restore soft-deleted record.

```typescript
await restore<Todo>('todos', todoId)
```

### transaction<T>(operations)
Sequential batch operations.

```typescript
import { transaction } from './lib/database'

await transaction([
  () => insertOne('todos', { title: 'Task 1', user_id: userId }),
  () => insertOne('todos', { title: 'Task 2', user_id: userId }),
])
```

## Using with Smart Queries (Recommended)

Instead of calling database operations directly, use the smart query hooks:

```typescript
// Instead of:
const todos = await fetchAll<Todo>('todos', { filter: (q) => q.eq('user_id', userId) })

// Use:
const { data: todos } = usePersonalTodos(userId)

// Instead of:
await insertOne('todos', { title, user_id: userId })

// Use:
const createTodo = useCreateTodo()
await createTodo.mutateAsync({ title, userId })
```

The smart query layer handles caching, optimistic updates, and realtime sync automatically.

## Generic Hooks Alternative

If you prefer useState-based hooks:

```typescript
import { useFetch, useInsert, useUpdate, useDelete, useLiveQuery } from './hooks'

// Fetch
const { data, loading, error, refetch } = useFetch<Todo>('todos', {
  filter: (q) => q.eq('user_id', userId),
})

// Live query (fetch + realtime)
const { data, loading, error } = useLiveQuery<Todo>('todos', {
  filter: (q) => q.eq('user_id', userId),
})

// Insert
const { insert, loading, error } = useInsert<Todo>('todos')
await insert({ title: 'New task', user_id: userId })

// Update
const { updateById, loading, error } = useUpdate<Todo>('todos')
await updateById(todoId, { completed: true })

// Delete
const { removeById, loading, error } = useDelete('todos')
await removeById(todoId)
```

## Error Handling

All database operations throw errors processed by `handleSupabaseError()`:

```typescript
try {
  const todos = await fetchAll<Todo>('todos')
} catch (err) {
  const { title, message, suggestion, code } = formatErrorForDisplay(err)
  console.error(`${title}: ${message}`)
  console.log(suggestion)
}
```
