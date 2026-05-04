# Skill 02: Database Operations

## Template Core Files
- `src/lib/database/queries.ts` - All read operations
- `src/lib/database/mutations.ts` - All write operations
- `src/lib/database/client.ts` - DB client re-export
- `src/lib/database/index.ts` - Barrel exports

## Query Functions (Read Operations)

### fetchAll<T>(table, options?)
The primary read function. Fetches records from any table with optional filtering, ordering, and pagination.
```typescript
const todos = await fetchAll<Todo>('todos', {
  filter: (q) => q.eq('user_id', userId).is('team_id', null),
  order: { column: 'created_at', ascending: false },
  limit: 50,
})
```
- **table**: Any table name (string)
- **options.columns**: Select specific columns (default: '*')
- **options.filter**: Function that receives the query builder and returns a modified query
- **options.order**: `{ column, ascending? }` for sorting
- **options.limit**: Max records to return
- **options.offset**: Skip N records (for manual pagination)

### fetchById<T>(table, id, options?)
Fetches a single record by its ID. Returns `null` if not found (code PGRST116).
```typescript
const todo = await fetchById<Todo>('todos', 'uuid-here')
```

### fetchWhere<T>(table, conditions, options?)
Fetches records matching exact equality conditions.
```typescript
const activeTodos = await fetchWhere<Todo>('todos', { completed: false, user_id: userId })
```

### fetchPaginated<T>(table, options?)
Returns paginated results with total count for pagination UI.
```typescript
const result = await fetchPaginated<Todo>('todos', {
  page: 1,
  pageSize: 20,
  order: { column: 'created_at', ascending: false },
})
// result: { data, count, page, pageSize, totalPages }
```

### search<T>(table, column, searchTerm, options?)
Case-insensitive ILIKE search on a single column.
```typescript
const results = await search<Todo>('todos', 'title', 'urgent')
// Matches: "urgent task", "This is URGENT", etc.
```

### fullTextSearch<T>(table, searchColumn, searchTerm, options?)
PostgreSQL full-text search using `textSearch()` method. Requires tsvector setup.

### count(table, options?)
Returns the number of records matching optional filter.
```typescript
const total = await count('todos', { filter: (q) => q.eq('completed', false) })
```

### exists(table, conditions)
Checks if any record matches the conditions.
```typescript
const hasTodos = await exists('todos', { user_id: userId })
```

### createQuery(table)
Returns a raw query builder for complex operations.
```typescript
const { select, insert, update, delete: remove, upsert } = createQuery('todos')
```

## Mutation Functions (Write Operations)

### insertOne<T>(table, data)
Inserts a single record and returns the created record.
```typescript
const newTodo = await insertOne<Todo>('todos', {
  title: 'New task',
  completed: false,
  user_id: userId,
})
```

### insertMany<T>(table, data)
Inserts multiple records in a single call.
```typescript
const newTodos = await insertMany<Todo>('todos', [
  { title: 'Task 1', user_id: userId },
  { title: 'Task 2', user_id: userId },
])
```

### updateById<T>(table, id, data)
Updates a record by ID and returns the updated record.
```typescript
const updated = await updateById<Todo>('todos', todoId, { completed: true })
```

### updateWhere<T>(table, conditions, data)
Updates all records matching conditions.
```typescript
await updateWhere('todos', { user_id: userId, completed: false }, { completed: true })
```

### upsert<T>(table, data, options?)
Inserts if not exists, updates if exists. Default conflict target is 'id'.
```typescript
const result = await upsert<User>('users', { id: userId, full_name: 'New Name' }, {
  onConflict: 'id',
})
```

### deleteById(table, id)
Deletes a record by ID.
```typescript
await deleteById('todos', todoId)
```

### deleteWhere(table, conditions)
Deletes records matching conditions. Returns count of deleted records.
```typescript
const deleted = await deleteWhere('todos', { user_id: userId, completed: true })
```

### deleteMany(table, ids)
Deletes multiple records by ID list.
```typescript
await deleteMany('todos', [id1, id2, id3])
```

### softDelete<T>(table, id)
Sets `deleted_at` timestamp instead of physically deleting.
```typescript
const softDeleted = await softDelete<Todo>('todos', todoId)
```

### restore<T>(table, id)
Restores a soft-deleted record by setting `deleted_at` to null.
```typescript
const restored = await restore<Todo>('todos', todoId)
```

### bulkInsert<T>(table, items)
Alias for insertMany with different naming convention.

### bulkUpdate<T>(table, items)
Updates multiple records by ID with different data each.
```typescript
await bulkUpdate('todos', [
  { id: id1, data: { completed: true } },
  { id: id2, data: { title: 'Updated' } },
])
```

### transaction<T>(operations)
Sequentially executes operations. Throws on first error (simulated transaction).
```typescript
await transaction([
  () => insertOne('todos', { title: 'Task 1', user_id: userId }),
  () => insertOne('todos', { title: 'Task 2', user_id: userId }),
])
```
