# Skill: CRUD Operations

## id
`nexora.crud-operations`

## name
CRUD Operations

## category
database

## description
Generic database CRUD abstraction layer for Supabase with filtering, sorting, pagination, and relational query support.

## intent
### what
Provides clean, type-safe functions for all standard database operations: create, read, update, delete. Supports composable filters, sorting, pagination, and validation.

### why
Eliminates repetitive database code, ensures consistent error handling, and provides a Prisma-like developer experience on top of Supabase.

## inputs
```typescript
// fetchAll
{
  table: string
  options?: {
    select?: string
    filters?: FilterCondition[]
    orderBy?: { column: string; ascending?: boolean }[]
    limit?: number
    offset?: number
    timeout?: number
    retries?: number
  }
}

// insertOne
{
  table: string
  data: Record<string, unknown>
  options?: MutationOptions
}

// FilterCondition
{
  column: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is'
  value: unknown
}
```

## outputs
```typescript
// fetchAll, fetchWhere, search
{ data: T[] | null; error: Error | null; count: number }

// fetchById
{ data: T | null; error: Error | null }

// insertOne, updateById, upsert
T (the inserted/updated record)

// deleteById
void

// count, exists
number | boolean
```

## usage
### steps
1. Import the desired function from `nexora-engine`
2. Call with table name and options
3. Handle the returned Promise

### code examples
```typescript
import { fetchAll, fetchById, insertOne, updateById, deleteById, search, count } from 'nexora-engine'

// Fetch all with filters
const { data: users } = await fetchAll<User>('users', {
  filters: [
    { column: 'status', operator: 'eq', value: 'active' },
    { column: 'age', operator: 'gte', value: 18 },
  ],
  orderBy: [{ column: 'created_at', ascending: false }],
  limit: 20,
})

// Fetch by ID
const { data: user } = await fetchById<User>('users', 'user-uuid')

// Insert
const newUser = await insertOne<User>('users', {
  name: 'John',
  email: 'john@example.com',
})

// Update
const updated = await updateById<User>('users', 'user-uuid', {
  name: 'Jane',
})

// Delete
await deleteById('users', 'user-uuid')

// Search (ILIKE)
const { data: results } = await search<User>('users', 'name', 'john')

// Count
const activeCount = await count('users', [
  { column: 'status', operator: 'eq', value: 'active' },
])

// Check existence
const exists = await exists('users', [
  { column: 'email', operator: 'eq', value: 'test@example.com' },
])
```

## logic
### internal flow
1. Get Supabase client instance
2. Build query with `supabase.from(table)`
3. Apply filters via `applyFilters()`
4. Apply sorting via `applySorting()`
5. Apply pagination (limit/offset or range)
6. Execute with timeout and retry support
7. Return normalized response

### execution reasoning
- All queries go through `executeRequest()` for consistent timeout/retry handling
- Cache integration happens at the QueryEngine layer, not here
- Filters map directly to Supabase query builders (eq, neq, gt, etc.)

## constraints
### rules
- Table name must be a valid Supabase table
- ID must be a string or number
- Filter operators must be valid Supabase operators
- For `select`, use comma-separated column names

### anti-patterns
- Don't use raw SQL strings (use the filter system)
- Don't forget to handle null data in responses
- Don't use `any` type - use proper generics

## dependencies
### internal SDK modules
- `getClient` (from `./core/client`)
- `executeRequest` (from `./core/pipeline`)
- `DatabaseError` (from `./errors/nexora-error`)

### external libraries
- `@supabase/supabase-js`

## code_mapping
```typescript
// SDK Functions
fetchAll()       -> fetchAll<T>()
fetchById()      -> fetchById<T>()
fetchWhere()      -> fetchWhere<T>()
fetchPaginated() -> fetchPaginated<T>()
search()         -> search<T>()
fullTextSearch() -> fullTextSearch<T>()
count()          -> count()
exists()         -> exists()
insertOne()      -> insertOne<T>()
insertMany()     -> insertMany<T>()
updateById()     -> updateById<T>()
updateWhere()    -> updateWhere<T>()
upsert()         -> upsert<T>()
deleteById()     -> deleteById()
deleteWhere()    -> deleteWhere()
deleteMany()     -> deleteMany()
softDelete()     -> softDelete<T>()
restore()        -> restore<T>()
```

## ai_instructions
### when to use
- Use `fetchAll` for listing records with optional filters
- Use `fetchById` when you know the primary key
- Use `fetchPaginated` for paginated list views
- Use `search` for simple text search (ILIKE)
- Use `fullTextSearch` for PostgreSQL full-text search
- Use mutation functions for write operations

### when NOT to use
- Don't use for real-time subscriptions (use `subscribeToTable`)
- Don't use for file storage (use storage module)
- Don't use for auth operations (use auth module)

### reasoning strategy
1. Identify the operation type (read vs write)
2. Choose the appropriate function based on needs (single vs multiple, paginated vs all)
3. Apply filters/sorting/pagination as needed
4. Use proper TypeScript generics for type safety
5. Handle the response properly (check data vs null)

## metadata
- complexity: low
- stability: stable
- sdk_layer: query
