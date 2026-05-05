# Skill: Infinite Scroll & Advanced Query Features

## id
`nexora.infinite-scroll`

## name
Infinite Scroll & Advanced Query Features

## category
query

## description
Nexora Engine's infinite scroll manager, cursor-based pagination, optimistic updates, and enhanced QueryBuilder capabilities for building performant, responsive data loading experiences.

## intent
### what
Provides tools for implementing infinite scroll patterns, cursor-based pagination for efficient data loading, optimistic UI updates with automatic rollback, and an enhanced QueryBuilder with chainable filter methods and query cancellation.

### why
Offset-based pagination becomes inefficient with large datasets. Cursor pagination scales better and avoids skip overhead. Optimistic updates improve perceived performance by showing changes immediately. Query cancellation prevents wasted network requests on unmounted components or superseded searches.

## inputs
```typescript
interface InfiniteScrollOptions {
  table: string
  columns?: string
  filters?: Filter[]
  sort?: SortConfig[]
  pageSize?: number         // default: 20
  cursorColumn?: string     // default: 'id'
  ttl?: number
  bypassCache?: boolean
  timeout?: number
  retries?: number
}

interface InfiniteScrollState<T> {
  data: T[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  cursor: string | null
  error: Error | null
  totalCount: number
}

interface CursorPaginatedResponse<T> {
  data: T[]
  hasMore: boolean
  nextCursor: string | null
  totalCount: number
}
```

## outputs
```typescript
// InfiniteScrollManager methods
load()        -> Promise<InfiniteScrollState<T>>
loadMore()    -> Promise<InfiniteScrollState<T>>
preloadNext() -> Promise<void>
reset()       -> InfiniteScrollState<T>
refresh()     -> Promise<InfiniteScrollState<T>>
getState()    -> InfiniteScrollState<T>
append(item)  -> void
remove(id)    -> void
update(id, data) -> void
cancel()      -> void

// Cursor pagination
queryPaginatedCursor() -> Promise<CursorPaginatedResponse<T>>

// Optimistic updates
optimisticUpdate() -> Promise<{ rollback: () => void }>

// Enhanced QueryBuilder
.eq(column, value)    -> this
.neq(column, value)   -> this
.gt(column, value)    -> this
.gte(column, value)   -> this
.lt(column, value)    -> this
.lte(column, value)   -> this
.like(column, value)  -> this
.ilike(column, value) -> this
.in(column, values)   -> this
.is(column, value)    -> this
.contains(column, value) -> this
.containedBy(column, value) -> this
.overlap(column, value) -> this
.match(value)         -> this
.not(column, op, value) -> this
.single()             -> this
.head()               -> this
.abort()              -> this
.cancel()             -> void
```

## usage
### steps

#### Infinite Scroll
1. Create an InfiniteScrollManager via `queryEngine.createInfiniteScroll(options)`
2. Call `load()` to fetch initial page
3. Call `loadMore()` when user scrolls near the bottom
4. Use `getState()` to access current state at any time
5. Use `append()`, `remove()`, `update()` for real-time state mutations

#### Cursor Pagination
1. Call `queryEngine.queryPaginatedCursor(options)` for first page
2. Use `nextCursor` from response for subsequent pages
3. Continue until `hasMore` is false

#### Optimistic Updates
1. Call `queryEngine.optimisticUpdate(table, id, data, updateFn)`
2. Cache is updated immediately
3. If updateFn fails, cache is automatically rolled back
4. Use returned `rollback()` for manual rollback

#### Enhanced QueryBuilder
1. Use chainable filter methods instead of array-based filters
2. Call `.single()` before `.execute()` for single results
3. Call `.head()` before `.execute()` for count-only queries
4. Call `.abort()` to enable cancellation support
5. Call `.cancel()` to abort in-flight requests

### code examples
```typescript
import { queryEngine, createQuery } from 'nexora-engine'

// === Infinite Scroll ===
const scroll = queryEngine.createInfiniteScroll({
  table: 'posts',
  filters: [{ column: 'published', operator: 'eq', value: true }],
  sort: [{ column: 'created_at', ascending: false }],
  pageSize: 20,
})

// Initial load
const state = await scroll.load()
// state: { data: [...20 posts], hasMore: true, cursor: 'post-20-id', ... }

// Load more
const moreState = await scroll.loadMore()
// moreState: { data: [...40 posts], hasMore: true, cursor: 'post-40-id', ... }

// Real-time updates
scroll.append(newPost)
scroll.remove(postId)
scroll.update(postId, { title: 'Updated Title' })

// === Cursor Pagination ===
const page1 = await queryEngine.queryPaginatedCursor({
  table: 'posts',
  pageSize: 20,
  sort: [{ column: 'id', ascending: true }],
})

const page2 = await queryEngine.queryPaginatedCursor({
  table: 'posts',
  pageSize: 20,
  sort: [{ column: 'id', ascending: true }],
  cursor: page1.nextCursor,
})

// === Optimistic Updates ===
const { rollback } = await queryEngine.optimisticUpdate(
  'posts',
  postId,
  { title: 'New Title' },
  async (data) => {
    return await updateById('posts', postId, data)
  }
)

// === Enhanced QueryBuilder ===
const { data } = await createQuery('posts')
  .eq('published', true)
  .gt('views', 100)
  .contains('tags', ['tutorial'])
  .sort([{ column: 'created_at', ascending: false }])
  .paginate(1, 20)
  .execute()

// Single result
const post = await createQuery('posts')
  .eq('slug', 'my-post')
  .single()
  .executeSingle()

// Query cancellation
const query = createQuery('posts')
  .eq('search', searchTerm)
  .abort()

// Later, cancel if search term changed
query.cancel()

const { data } = await query.execute()
```

## logic
### internal flow

#### Infinite Scroll
1. `load()` fetches first page with no cursor, sets state.loading = true
2. Fetches limit+1 items to determine if more exist
3. If items > limit, hasMore = true, sets cursor from last item
4. `loadMore()` appends new data to existing state.data array
5. State mutations (append/remove/update) modify cached data directly
6. `preloadNext()` silently fetches next page into cache without updating state

#### Cursor Pagination
1. On first page (no cursor), performs a count query for totalCount
2. Uses `gt` or `lt` operator on cursor column depending on sort direction
3. Fetches limit+1 to detect if more data exists
4. Returns sliced data (without the extra item) and the cursor value

#### Optimistic Updates
1. Scans cache for entries matching the table pattern
2. Finds and patches the target item in each matching cache entry
3. Stores original values for rollback
4. Executes the update function
5. On success: updates cache with server response
6. On failure: restores original values from stored backup

#### Enhanced QueryBuilder
1. Each chainable method pushes a filter to internal array
2. `.single()` sets flag to append `.single()` to Supabase query
3. `.head()` sets flag to use head query (count only, no data)
4. `.abort()` creates AbortController for cancellation
5. `.cancel()` calls AbortController.abort() to cancel in-flight request

### execution reasoning
- Cursor pagination is more efficient than offset for large datasets (no SKIP overhead)
- Preloading next page during current page render eliminates scroll jank
- Optimistic updates assume high success rate; rollback handles the rare failures
- Query cancellation prevents race conditions in search inputs and rapid navigation

## constraints
### rules
- Cursor column must be unique and sortable (typically `id` or `created_at`)
- Sort direction affects cursor comparison (ascending uses `gt`, descending uses `lt`)
- Optimistic updates only work with cached data; direct fetches are not affected
- `.cancel()` must be called before or during `.execute()` to have effect
- `preloadNext()` errors are silently ignored to not interrupt user experience

### anti-patterns
- Don't use offset pagination for large datasets (>1000 rows)
- Don't use optimistic updates for critical operations that must be accurate
- Don't call `loadMore()` when `hasMore` is false
- Don't mix cursor and offset pagination in the same view
- Don't forget to call `cancel()` on unmount to prevent memory leaks

## dependencies
### internal SDK modules
- `QueryEngine` (from `./query-engine/engine`)
- `QueryBuilder`, `createQuery` (from `./query-engine/builder`)
- `QueryCache` (from `./cache/cache`)
- `count` (from `./database/queries`)
- `executeRequest` (from `./core/pipeline`)

### external libraries
- `@supabase/supabase-js`

## code_mapping
```typescript
// Infinite Scroll
queryEngine.createInfiniteScroll() -> InfiniteScrollManager constructor
scroll.load()        -> InfiniteScrollManager.load()
scroll.loadMore()    -> InfiniteScrollManager.loadMore()
scroll.preloadNext() -> InfiniteScrollManager.preloadNext()
scroll.reset()       -> InfiniteScrollManager.reset()
scroll.refresh()     -> InfiniteScrollManager.refresh()
scroll.getState()    -> InfiniteScrollManager.getState()
scroll.append()      -> InfiniteScrollManager.append()
scroll.remove()      -> InfiniteScrollManager.remove()
scroll.update()      -> InfiniteScrollManager.update()
scroll.cancel()      -> InfiniteScrollManager.cancel()

// Cursor Pagination
queryEngine.queryPaginatedCursor() -> QueryEngine.queryPaginatedCursor()

// Optimistic Updates
queryEngine.optimisticUpdate() -> QueryEngine.optimisticUpdate()

// Enhanced QueryBuilder
createQuery().eq()          -> QueryBuilder.eq()
createQuery().neq()         -> QueryBuilder.neq()
createQuery().gt()          -> QueryBuilder.gt()
createQuery().gte()         -> QueryBuilder.gte()
createQuery().lt()          -> QueryBuilder.lt()
createQuery().lte()         -> QueryBuilder.lte()
createQuery().like()        -> QueryBuilder.like()
createQuery().ilike()       -> QueryBuilder.ilike()
createQuery().in()          -> QueryBuilder.in()
createQuery().is()          -> QueryBuilder.is()
createQuery().contains()    -> QueryBuilder.contains()
createQuery().containedBy() -> QueryBuilder.containedBy()
createQuery().overlap()     -> QueryBuilder.overlap()
createQuery().match()       -> QueryBuilder.match()
createQuery().not()         -> QueryBuilder.not()
createQuery().single()      -> QueryBuilder.single()
createQuery().head()        -> QueryBuilder.head()
createQuery().abort()       -> QueryBuilder.abort()
createQuery().cancel()      -> QueryBuilder.cancel()
```

## ai_instructions
### when to use
- Use infinite scroll for feeds, timelines, and long lists where users browse sequentially
- Use cursor pagination for datasets >1000 rows or when performance matters
- Use optimistic updates for non-critical UI interactions (likes, title edits, etc.)
- Use query cancellation for search inputs, rapid navigation, and debounced queries
- Use preload for smooth infinite scroll experiences without loading spinners

### when NOT to use
- Don't use infinite scroll for paginated admin tables where users need to jump to specific pages
- Don't use cursor pagination when users need to navigate to arbitrary page numbers
- Don't use optimistic updates for financial transactions or critical state changes
- Don't use cancellation for idempotent operations that are safe to complete

### reasoning strategy
1. Assess data size: >1000 rows → cursor pagination, <1000 → offset is fine
2. Assess user pattern: sequential browsing → infinite scroll, jumping → offset pagination
3. Assess operation criticality: non-critical → optimistic, critical → wait for server
4. Assess interaction speed: fast-typing search → cancellation, single submit → no cancellation
5. For infinite scroll: implement IntersectionObserver to trigger loadMore at 80% scroll

## metadata
- complexity: medium
- stability: stable
- sdk_layer: query_engine
