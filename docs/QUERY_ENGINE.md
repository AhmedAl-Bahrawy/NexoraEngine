# Query Engine

The query engine provides a smart, cached layer over database operations with a fluent builder API.

## QueryEngine

The `QueryEngine` is the primary interface for cached database operations. It wraps all database operations with automatic caching, deduplication, and invalidation.

```typescript
import { queryEngine } from '@/lib'
// Or create a custom instance:
import { QueryEngine, QueryCache } from '@/lib'
const engine = new QueryEngine(new QueryCache({ defaultTTL: 60_000 }))
```

## Query Operations

### Fetch Multiple

```typescript
const users = await queryEngine.query<User>({
  table: 'users',
  columns: 'id, name, email',
  filters: [
    { column: 'status', operator: 'eq', value: 'active' },
    { column: 'role', operator: 'in', value: ['admin', 'member'] },
  ],
  sort: [{ column: 'created_at', ascending: false }],
  pagination: { limit: 20, offset: 0 },
  ttl: 60_000,
})
```

### Fetch Single

```typescript
const user = await queryEngine.querySingle<User>('users', [
  { column: 'email', operator: 'eq', value: 'john@example.com' },
])
```

### Paginated Query

```typescript
const result = await queryEngine.queryPaginated<User>({
  table: 'posts',
  filters: [{ column: 'published', operator: 'eq', value: true }],
  sort: [{ column: 'created_at', ascending: false }],
  page: 1,
  pageSize: 20,
})

// result: { data, count, page, pageSize, totalPages }
```

### Count

```typescript
const count = await queryEngine.queryCount('users', [
  { column: 'status', operator: 'eq', value: 'active' },
])
```

## Mutation Operations

### Create

```typescript
const user = await queryEngine.create<User>('users', {
  name: 'John',
  email: 'john@example.com',
})
```

### Create Many

```typescript
const users = await queryEngine.createMany<User>('users', [
  { name: 'John', email: 'john@example.com' },
  { name: 'Jane', email: 'jane@example.com' },
])
```

### Update

```typescript
const updated = await queryEngine.update<User>('users', 'user-id', {
  name: 'John Doe',
})
```

### Update Where

```typescript
const updated = await queryEngine.updateWhere<User>('users',
  { status: 'pending' },
  { status: 'active' }
)
```

### Upsert

```typescript
const result = await queryEngine.upsert<User>('users', {
  id: 'user-id',
  name: 'John',
})
```

### Delete

```typescript
await queryEngine.remove('users', 'user-id')
```

### Delete Where

```typescript
const deletedCount = await queryEngine.removeWhere('users', {
  status: 'inactive',
})
```

## Query Builder

For complex queries requiring full control, use the fluent `QueryBuilder`:

```typescript
import { createQuery } from '@/lib'
import { supabase } from '@/lib'

const query = createQuery<User>(supabase, 'users')
```

### Filtering

```typescript
query
  .eq('status', 'active')
  .neq('role', 'banned')
  .gt('created_at', '2024-01-01')
  .gte('age', 18)
  .lt('score', 100)
  .lte('attempts', 3)
  .like('name', '%John%')
  .ilike('email', '%@example.com')  // Case-insensitive
  .is('deleted_at', null)
  .in('role', ['admin', 'moderator'])
  .contains('tags', ['featured'])
```

### Sorting

```typescript
query
  .orderBy('created_at', { ascending: false })
  .orderBy('name', { ascending: true, nullsFirst: false })
```

### Pagination

```typescript
query
  .limit(20)
  .offset(40)

// Or by page
query.paginate(3, 20)  // Page 3, 20 per page
```

### Execution

```typescript
// Fetch multiple
const users = await query.execute()

// Fetch single
const user = await query.single().executeSingle()

// Get count
const count = await query.executeCount()

// Head query (metadata only)
const head = await query.head().execute()
```

## Filter Operators

| Operator | Description | SQL Equivalent |
|----------|-------------|----------------|
| `eq` | Equal | `= value` |
| `neq` | Not equal | `!= value` |
| `gt` | Greater than | `> value` |
| `gte` | Greater than or equal | `>= value` |
| `lt` | Less than | `< value` |
| `lte` | Less than or equal | `<= value` |
| `like` | Pattern match (case-sensitive) | `LIKE pattern` |
| `ilike` | Pattern match (case-insensitive) | `ILIKE pattern` |
| `is` | Null/boolean check | `IS value` |
| `in` | Value in list | `IN (values)` |
| `contains` | Array/object contains | `@>` |
| `contained` | Array/object contained | `<@` |
| `overlap` | Array overlap | `&&` |
| `match` | Multiple equality | `col1=val1 AND col2=val2` |
| `not` | Negation | `NOT operator value` |

## Direct Database Operations

For operations that bypass the query engine entirely:

```typescript
import { fetchAll, fetchById, insertOne, updateById, deleteById } from '@/lib'

// Fetch
const all = await fetchAll('table')
const one = await fetchById('table', 'id')
const filtered = await fetchWhere('table', { status: 'active' })
const paginated = await fetchPaginated('table', { page: 1, pageSize: 20 })

// Mutate
const created = await insertOne('table', data)
const createdMany = await insertMany('table', [data1, data2])
const updated = await updateById('table', 'id', data)
const deleted = await deleteById('table', 'id')
```

## Best Practices

1. **Use QueryEngine for most operations** - Gets caching and invalidation for free
2. **Use QueryBuilder for complex queries** - When you need fine-grained control
3. **Use direct operations when** - You need to bypass caching or use special features
4. **Always type your results** - Use generics for type safety
5. **Handle errors** - All operations throw typed errors
