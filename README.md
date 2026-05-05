# Nexora Engine

A universal backend SDK built on Supabase. Build any application without rewriting backend logic.

[![npm version](https://badge.fury.io/js/nexora-engine.svg)](https://www.npmjs.com/package/nexora-engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-AhmedAl--Bahrawy/NexoraEngine-blue)](https://github.com/AhmedAl-Bahrawy/NexoraEngine)

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
  - [Client Initialization](#client-initialization)
  - [Database Operations](#database-operations)
  - [Query Engine](#query-engine)
  - [Authentication](#authentication)
  - [Storage](#storage)
  - [Caching](#caching)
  - [Validation](#validation)
  - [Error Handling](#error-handling)
  - [Realtime](#realtime)
- [Advanced Usage](#advanced-usage)
- [AI Skills System](#ai-skills-system)
- [Examples](#examples)
- [TypeScript Support](#typescript-support)
- [Contributing](#contributing)
- [License](#license)

## Overview

Nexora Engine is a production-grade, universal backend SDK that provides:

- **No application-specific logic** - Build any app without rewriting backend code
- **No hardcoded schemas** - Works with any database structure
- **Full TypeScript support** - Type-safe database operations
- **Built on Supabase** - Leverages Supabase JS v2 client
- **Intelligent caching** - TTL-based caching with automatic invalidation
- **Advanced query building** - Fluent query builder with filtering, sorting, pagination
- **Comprehensive auth** - Complete authentication and authorization system
- **Full realtime system** - Database subscriptions, broadcast messaging, presence tracking
- **Zod v4 validation** - Schema validation for data integrity
- **AI-ready** - Includes skill files for AI-powered development

## Installation

```bash
npm install nexora-engine
```

Or with yarn:

```bash
yarn add nexora-engine
```

Or with pnpm:

```bash
pnpm add nexora-engine
```

## Quick Start

### 1. Initialize the Client

```typescript
import { createNexoraClient } from 'nexora-engine'

// Initialize with your Supabase credentials
const client = createNexoraClient({
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseKey: 'your-anon-key',
  
  // Optional configurations
  autoConnect: true,
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
    retryableErrors: ['network', 'timeout']
  }
})

// Or initialize globally (recommended for most apps)
import { createNexoraClient as initNexora } from 'nexora-engine'

initNexora({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_ANON_KEY!,
})
```

### 2. Basic Database Operations

```typescript
import { 
  fetchAll, 
  fetchById, 
  insertOne, 
  updateById, 
  deleteById 
} from 'nexora-engine'

// Fetch all records
const { data: users } = await fetchAll('users', {
  select: 'id, name, email',
  filters: [{ column: 'active', operator: 'eq', value: true }],
  orderBy: [{ column: 'created_at', ascending: false }],
  limit: 10
})

// Fetch by ID
const { data: user } = await fetchById('users', 'user-123')

// Insert
const { data: newUser } = await insertOne('users', {
  name: 'John Doe',
  email: 'john@example.com'
})

// Update
await updateById('users', 'user-123', {
  name: 'Jane Doe'
})

// Delete
await deleteById('users', 'user-123')
```

### 3. Using the Query Engine

```typescript
import { queryEngine } from 'nexora-engine'

// Simple query with caching
const users = await queryEngine.query({
  table: 'users',
  columns: 'id, name, email',
  filters: [{ column: 'active', operator: 'eq', value: true }],
  sort: [{ column: 'created_at', ascending: false }],
  pagination: { limit: 20, offset: 0 },
  ttl: 60000 // Cache for 60 seconds
})

// Paginated query
const result = await queryEngine.queryPaginated({
  table: 'posts',
  page: 1,
  pageSize: 20,
  filters: [{ column: 'published', operator: 'eq', value: true }]
})

console.log(result.data) // Array of posts
console.log(result.count) // Total count
console.log(result.totalPages) // Total pages

// Count records
const userCount = await queryEngine.queryCount('users')

// Single record
const user = await queryEngine.querySingle('users', [
  { column: 'email', operator: 'eq', value: 'user@example.com' }
])
```

### 4. Authentication

```typescript
import { 
  signUp, 
  signInWithPassword, 
  signOut, 
  getSession 
} from 'nexora-engine'

// Sign up
const { data, error } = await signUp({
  email: 'user@example.com',
  password: 'secure-password'
})

// Sign in
const { data: session } = await signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password'
})

// Sign out
await signOut()

// Check session
const { data: { session } } = await getSession()
```

## Core Concepts

### Layered Architecture

Nexora Engine uses a layered architecture:

```
┌─────────────────────────────────────┐
│         Application Layer          │
├─────────────────────────────────────┤
│         Query Engine Layer         │
│  (Builder, Caching, Pagination)   │
├─────────────────────────────────────┤
│         Database Layer             │
│    (Queries, Mutations, CRUD)     │
├─────────────────────────────────────┤
│         Core Layer                 │
│   (Client, Pipeline, Retry)       │
├─────────────────────────────────────┤
│      Supabase JS Client v2         │
└─────────────────────────────────────┘
```

### Client Initialization

The SDK supports two initialization patterns:

1. **Global initialization** (recommended): Initialize once, use everywhere
2. **Instance-based**: Create multiple clients for different Supabase projects

### Caching Strategy

Nexora Engine includes an intelligent caching system:

- **Automatic cache keys**: Generated from query parameters
- **TTL support**: Set cache duration per query
- **Smart invalidation**: Mutations automatically invalidate related cache entries
- **Deduplication**: Concurrent identical queries are deduplicated

## API Reference

### Client Initialization

#### `createNexoraClient(config)`

Creates and initializes the Nexora client.

```typescript
import { createNexoraClient } from 'nexora-engine'

const client = createNexoraClient({
  supabaseUrl: string,
  supabaseKey: string,
  autoConnect?: boolean,
  retry?: {
    maxRetries?: number,
    retryDelay?: number,
    retryableErrors?: string[]
  }
})

// Returns: { supabase: SupabaseClient }
```

#### `getClient()`

Gets the globally initialized Supabase client.

```typescript
import { getClient } from 'nexora-engine'

const supabase = getClient()
// Returns: SupabaseClient
```

### Database Operations

#### Query Functions

##### `fetchAll(table, options?)`

Fetch multiple records from a table.

```typescript
import { fetchAll } from 'nexora-engine'

const { data, error, count } = await fetchAll('users', {
  select: 'id, name, email', // Columns to select
  filters: [                  // Filter conditions
    { column: 'age', operator: 'gte', value: 18 }
  ],
  orderBy: [                  // Sort order
    { column: 'created_at', ascending: false }
  ],
  limit: 10,                  // Max records
  offset: 0,                  // Skip records
  useCache: true,             // Use cache (default: true)
  ttl: 60000,                // Cache TTL in ms
  timeout: 30000,             // Request timeout
  retries: 3                  // Retry attempts
})

// Returns: { data: T[] | null, error: Error | null, count: number }
```

**Filter Operators:**
- `eq` - Equal
- `neq` - Not equal
- `gt` - Greater than
- `gte` - Greater than or equal
- `lt` - Less than
- `lte` - Less than or equal
- `like` - SQL LIKE pattern
- `ilike` - Case-insensitive LIKE
- `in` - Value in array
- `is` - Is (null, true, false)
- `contains` - Array/object contains
- `containedBy` - Array/object contained by
- `overlap` - Array overlap
- `match` - Multiple equality match

##### `fetchById(table, id, options?)`

Fetch a single record by ID.

```typescript
const { data, error } = await fetchById('users', 'user-123', {
  select: 'id, name, email',
  timeout: 30000
})

// Returns: { data: T | null, error: Error | null }
```

##### `fetchWhere(table, filters, options?)`

Fetch records matching specific conditions.

```typescript
const { data, error } = await fetchWhere('users', [
  { column: 'email', operator: 'eq', value: 'user@example.com' }
])
```

##### `fetchPaginated(table, options?)`

Fetch paginated results.

```typescript
const result = await fetchPaginated('posts', {
  page: 1,
  pageSize: 20,
  filters: [{ column: 'published', operator: 'eq', value: true }],
  orderBy: [{ column: 'created_at', ascending: false }]
})

// Returns: PaginatedResult<T>
// {
//   data: T[] | null,
//   count: number,
//   page: number,
//   pageSize: number,
//   totalPages: number,
//   hasNextPage: boolean,
//   hasPreviousPage: boolean
// }
```

##### Cursor-Based Paginated Response

```typescript
// Returns: CursorPaginatedResponse<T>
// {
//   data: T[],
//   hasMore: boolean,
//   nextCursor: string | null,
//   totalCount: number
// }
```

##### `search(table, searchTerm, options?)`

Full-text search across specified columns.

```typescript
const { data } = await search('posts', 'typescript tutorial', {
  columns: ['title', 'content'],
  select: 'id, title, created_at'
})
```

##### `count(table, filters?)`

Count records matching filters.

```typescript
const count = await count('users', [
  { column: 'active', operator: 'eq', value: true }
])
// Returns: number
```

##### `exists(table, filters)`

Check if records exist.

```typescript
const exists = await exists('users', [
  { column: 'email', operator: 'eq', value: 'user@example.com' }
])
// Returns: boolean
```

#### Mutation Functions

##### `insertOne(table, data, options?)`

Insert a single record.

```typescript
const { data, error } = await insertOne('users', {
  name: 'John Doe',
  email: 'john@example.com',
  age: 25
})

// Returns: { data: T | null, error: Error | null }
```

##### `insertMany(table, data, options?)`

Insert multiple records.

```typescript
const { data, error } = await insertMany('users', [
  { name: 'User 1', email: 'user1@example.com' },
  { name: 'User 2', email: 'user2@example.com' }
])
```

##### `updateById(table, id, data, options?)`

Update a record by ID.

```typescript
await updateById('users', 'user-123', {
  name: 'Updated Name',
  updated_at: new Date().toISOString()
})
```

##### `updateWhere(table, conditions, data, options?)`

Update records matching conditions.

```typescript
await updateWhere('users', 
  { column: 'subscription', operator: 'eq', value: 'expired' },
  { status: 'inactive' }
)
```

##### `upsert(table, data, options?)`

Upsert (insert or update) a record.

```typescript
await upsert('users', {
  id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com'
})
```

##### `deleteById(table, id, options?)`

Delete a record by ID.

```typescript
await deleteById('users', 'user-123')
// Returns: void
```

##### `deleteWhere(table, conditions, options?)`

Delete records matching conditions.

```typescript
await deleteWhere('users', [
  { column: 'last_login', operator: 'lt', value: '2023-01-01' }
])
// Returns: number (count of deleted records)
```

##### `softDelete(table, id, options?)`

Soft delete a record (sets `deleted_at`).

```typescript
await softDelete('users', 'user-123')
```

##### `restore(table, id, options?)`

Restore a soft-deleted record.

```typescript
await restore('users', 'user-123')
```

### Query Engine

The Query Engine provides a higher-level interface with built-in caching and advanced features.

#### `queryEngine.query(options)`

Execute a cached query.

```typescript
import { queryEngine } from 'nexora-engine'

const data = await queryEngine.query({
  table: 'users',
  columns: 'id, name, email',
  filters: [{ column: 'active', operator: 'eq', value: true }],
  sort: [{ column: 'created_at', ascending: false }],
  pagination: { limit: 20, offset: 0 },
  ttl: 60000,              // Cache TTL
  bypassCache: false,       // Skip cache
  timeout: 30000,
  retries: 3
})
```

#### `queryEngine.queryPaginated(options)`

Execute a paginated query with caching.

```typescript
const result = await queryEngine.queryPaginated({
  table: 'posts',
  page: 1,
  pageSize: 20,
  filters: [{ column: 'published', operator: 'eq', value: true }],
  ttl: 300000
})
```

#### `queryEngine.queryCount(table, filters?, options?)`

Count records with caching.

```typescript
const count = await queryEngine.queryCount('users', [
  { column: 'active', operator: 'eq', value: true }
], { ttl: 60000 })
```

#### `queryEngine.querySingle(table, filters, options?)`

Fetch a single record with caching.

```typescript
const user = await queryEngine.querySingle('users', [
  { column: 'email', operator: 'eq', value: 'user@example.com' }
])
```

#### QueryBuilder

Fluent interface for building complex queries.

```typescript
import { createQuery } from 'nexora-engine'

const query = createQuery('users')
  .select('id, name, email')
  .filters([
    { column: 'age', operator: 'gte', value: 18 },
    { column: 'active', operator: 'eq', value: true }
  ])
  .sort([{ column: 'created_at', ascending: false }])
  .paginate(1, 20)

const { data, error, count } = await query.execute()
```

#### Enhanced QueryBuilder Methods

```typescript
import { createQuery } from 'nexora-engine'

// Chainable filter methods
const query = createQuery('posts')
  .eq('published', true)
  .gt('views', 100)
  .ilike('title', '%typescript%')
  .contains('tags', ['tutorial'])
  .sort([{ column: 'created_at', ascending: false }])
  .paginate(1, 20)

// Single result
const post = await createQuery('posts')
  .eq('slug', 'my-post')
  .single()
  .execute()

// Head query (count only, no data)
const { count } = await createQuery('posts')
  .eq('published', true)
  .head()
  .execute()

// Abort/cancel a query
const query = createQuery('posts')
  .eq('published', true)
  .abort() // Enables abort support

// Cancel the query if still running
query.cancel()

const { data } = await query.execute()
```

### Infinite Scroll / Cursor Pagination

Nexora Engine supports cursor-based pagination for efficient infinite scroll patterns. Instead of loading all pages at once, data is fetched incrementally as the user scrolls.

```typescript
import { queryEngine, InfiniteScrollManager } from 'nexora-engine'

// Create an infinite scroll manager
const scroll = queryEngine.createInfiniteScroll({
  table: 'posts',
  columns: 'id, title, content, created_at',
  filters: [{ column: 'published', operator: 'eq', value: true }],
  sort: [{ column: 'created_at', ascending: false }],
  pageSize: 20,
  cursorColumn: 'id', // Column used for cursor (default: 'id')
})

// Load initial page
const state = await scroll.load()
console.log(state.data) // First 20 posts
console.log(state.hasMore) // true if more data available
console.log(state.cursor) // Cursor for next page

// Load more when user scrolls near the bottom
const moreState = await scroll.loadMore()
console.log(moreState.data.length) // 40 posts (20 + 20)
console.log(moreState.loadingMore) // Loading state for "load more"

// Get current state at any time
const currentState = scroll.getState()

// Reset and reload
scroll.reset()
await scroll.load()

// Refresh (reset + load)
await scroll.refresh()

// Manually update state (for real-time updates)
scroll.append(newPost) // Add item
scroll.remove(postId)  // Remove item
scroll.update(postId, { title: 'Updated' }) // Update item
```

#### React Example with Infinite Scroll

```tsx
import { useEffect, useRef, useCallback } from 'react'
import { queryEngine } from 'nexora-engine'

function PostList() {
  const scrollRef = useRef(
    queryEngine.createInfiniteScroll({
      table: 'posts',
      filters: [{ column: 'published', operator: 'eq', value: true }],
      sort: [{ column: 'created_at', ascending: false }],
      pageSize: 20,
    })
  )
  
  const [state, setState] = useState(scrollRef.current.getState())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    scrollRef.current.load().then(setState)
  }, [])

  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && state.hasMore && !state.loadingMore) {
        scrollRef.current.loadMore().then(setState)
      }
    })
    
    if (node) observerRef.current.observe(node)
  }, [state.hasMore, state.loadingMore])

  return (
    <div>
      {state.data.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
      
      {state.loadingMore && <LoadingSpinner />}
      
      <div ref={loadMoreRef} />
    </div>
  )
}
```

#### Cursor-Based Direct Query

For direct cursor pagination without the manager:

```typescript
import { queryEngine } from 'nexora-engine'

// First page
const page1 = await queryEngine.queryPaginatedCursor({
  table: 'posts',
  filters: [{ column: 'published', operator: 'eq', value: true }],
  sort: [{ column: 'created_at', ascending: false }],
  pageSize: 20,
})

console.log(page1.data)        // 20 posts
console.log(page1.hasMore)     // true if more available
console.log(page1.nextCursor)  // Cursor value for next page
console.log(page1.totalCount)  // Total count (only on first page)

// Next page using cursor
const page2 = await queryEngine.queryPaginatedCursor({
  table: 'posts',
  filters: [{ column: 'published', operator: 'eq', value: true }],
  sort: [{ column: 'created_at', ascending: false }],
  pageSize: 20,
  cursor: page1.nextCursor, // Use cursor from previous page
})
```

### Optimistic Updates

Optimistic updates improve perceived performance by immediately reflecting changes in the UI before the server confirms them. Nexora Engine provides built-in support for optimistic updates with automatic rollback on failure.

```typescript
import { queryEngine } from 'nexora-engine'

// Optimistic update with automatic cache update
const { rollback } = await queryEngine.optimisticUpdate(
  'posts',
  postId,
  { title: 'New Title' },
  async (data) => {
    // Actual server update
    return await updateById('posts', postId, data)
  }
)

// If needed, manually rollback
rollback()
```

#### Manual Optimistic Update Pattern

```typescript
import { queryEngine } from 'nexora-engine'

async function updatePostOptimistic(postId: string, newTitle: string) {
  const scroll = queryEngine.createInfiniteScroll({
    table: 'posts',
    pageSize: 20,
  })

  // 1. Load current state
  const state = await scroll.load()
  
  // 2. Optimistically update UI
  scroll.update(postId, { title: newTitle })
  
  try {
    // 3. Perform actual update
    await queryEngine.update('posts', postId, { title: newTitle })
  } catch (error) {
    // 4. Rollback on failure - the cache already has the update
    // so we need to invalidate and refetch
    queryEngine.invalidateTable('posts')
    await scroll.refresh()
  }
}
```

### Authentication

#### Basic Auth Operations

```typescript
import { 
  signUp,
  signInWithPassword,
  signInWithOTP,
  signInWithOAuth,
  signOut,
  resetPassword,
  updatePassword,
  getSession,
  getUser,
  isAuthenticated,
  refreshSession,
  onAuthStateChange
} from 'nexora-engine'

// Sign up
const { data, error } = await signUp({
  email: 'user@example.com',
  password: 'secure-password'
})

// Sign in with password
const { data, error } = await signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password'
})

// Sign in with OTP
await signInWithOTP({
  email: 'user@example.com'
})

// OAuth sign in
await signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://yourapp.com/callback'
  }
})

// Sign out
await signOut()

// Get current session
const { data: { session } } = await getSession()

// Get current user
const { data: { user } } = await getUser()

// Check if authenticated
const isAuth = await isAuthenticated()

// Refresh session
await refreshSession()

// Listen to auth state changes
const { data: { subscription } } = onAuthStateChange((event, session) => {
  console.log('Auth event:', event)
  console.log('Session:', session)
})
```

#### MFA (Multi-Factor Authentication)

```typescript
import { 
  enrollTOTP,
  challengeMFA,
  verifyMFA,
  unenrollMFA,
  listMFAFactors,
  getAuthenticatorAssuranceLevel
} from 'nexora-engine'

// Enroll TOTP
const { data } = await enrollTOTP({
  friendlyName: 'My Authenticator'
})
// Returns: { id, type, friendlyName, qrCode, secret, uri }

// Challenge MFA
await challengeMFA({ factorId: 'factor-id' })

// Verify MFA
const { data } = await verifyMFA({
  factorId: 'factor-id',
  code: '123456'
})

// List factors
const { data: factors } = await listMFAFactors()

// Unenroll factor
await unenrollMFA({ factorId: 'factor-id' })
```

#### Admin Operations

```typescript
import { 
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateUserById,
  inviteUserByEmail,
  generateLink
} from 'nexora-engine'

// Create user (admin)
const { data } = await createUser({
  email: 'newuser@example.com',
  password: 'password',
  emailConfirm: true,
  userMetadata: { role: 'user' }
})

// List users
const { data } = await listUsers({ page: 1, perPage: 20 })

// Update user
await updateUserById('user-id', {
  userMetadata: { role: 'admin' }
})

// Delete user
await deleteUser('user-id')

// Invite user
await inviteUserByEmail('invitee@example.com', {
  data: { role: 'editor' }
})
```

#### Auth Middleware

```typescript
import { 
  enforceAuth,
  requireRole,
  requireAnyRole,
  requireVerifiedEmail,
  withAuth,
  hasRole,
  isAdmin
} from 'nexora-engine'

// Check if user has role
const hasAdminRole = await hasRole('admin')

// Check if user has any of the roles
const hasRole = await requireAnyRole(['admin', 'editor'])

// Middleware: require authentication
await enforceAuth()

// Middleware: require specific role
await requireRole('admin')

// Middleware: require verified email
await requireVerifiedEmail()

// Check if admin
const admin = await isAdmin()

// Get auth context
const context = await withAuth()
```

### Storage

```typescript
import { 
  uploadFile,
  uploadWithValidation,
  downloadFile,
  deleteFile,
  listFiles,
  getPublicUrl,
  moveFile,
  copyFile,
  createSignedUrl,
  uploadImage,
  uploadDocument
} from 'nexora-engine'

// Upload file
const { path, fullPath } = await uploadFile(
  'avatars',           // bucket
  'user-123/avatar.jpg', // path
  file,                // File or Blob
  {
    upsert: true,
    contentType: 'image/jpeg',
    onProgress: (progress) => {
      console.log(`Uploaded: ${progress.percentage}%`)
    }
  }
)

// Upload with validation
await uploadWithValidation(
  'documents',
  'report.pdf',
  file,
  (file) => ({
    isValid: file.size < 10 * 1024 * 1024, // 10MB limit
    error: 'File too large'
  })
)

// Upload image (with image validation)
await uploadImage('images', 'photo.jpg', file, {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.9
})

// Download file
const { data } = await downloadFile('avatars', 'user-123/avatar.jpg')

// Delete file
await deleteFile('avatars', 'user-123/avatar.jpg')

// List files
const { data } = await listFiles('avatars', {
  limit: 100,
  offset: 0,
  sortBy: { column: 'name', order: 'asc' }
})

// Get public URL
const url = getPublicUrl('avatars', 'user-123/avatar.jpg')

// Create signed URL (for private files)
const { data } = await createSignedUrl('documents', 'report.pdf', 3600)
```

### Caching

```typescript
import { QueryCache, deriveCacheKey, deriveMutationKeys } from 'nexora-engine'

// Get cache instance
const cache = QueryCache.getInstance()

// Set cache
cache.set('my-key', { data: 'value' }, 60000) // TTL: 60 seconds

// Get from cache
const data = cache.get('my-key')

// Invalidate specific key
cache.invalidate('my-key')

// Invalidate by pattern
cache.invalidatePattern('users:') // Invalidates all keys starting with 'users:'

// Invalidate all
cache.invalidateAll()

// Get cache stats
const stats = cache.getStats()
// Returns: { hits, misses, size, keys }

// Derive cache key from query
const key = deriveCacheKey({
  table: 'users',
  operation: 'query',
  filters: { active: true },
  columns: 'id, name'
})

// Get mutation keys for invalidation
const keys = deriveMutationKeys('users')
// Returns: ['qb:users:', 'qb:users:all']
```

### Validation

Nexora Engine uses Zod v4 for validation.

```typescript
import { z } from 'zod'
import { validate, safeValidate, createValidator, commonSchemas } from 'nexora-engine'

// Define schema
const userSchema = z.object({
  name: commonSchemas.nonEmptyString,
  email: commonSchemas.email,
  age: commonSchemas.positiveNumber,
  role: z.enum(['user', 'admin']).default('user')
})

// Validate data (throws on error)
try {
  const validData = validate(userSchema, {
    name: 'John',
    email: 'john@example.com',
    age: 25
  })
} catch (error) {
  // ValidationError with field errors
}

// Safe validation (returns result)
const result = safeValidate(userSchema, invalidData)
if (result.success) {
  console.log(result.data)
} else {
  console.log(result.error.fieldErrors)
}

// Create validator
const userValidator = createValidator(userSchema)

// Use validator
const data = userValidator.validate(inputData)
const result = userValidator.safeValidate(inputData)

// Common schemas
const schemas = commonSchemas
// Available: email, password, uuid, url, phone, nonEmptyString, 
//           positiveNumber, pagination, filter
```

### Utility Functions

Nexora Engine includes utility functions for common tasks.

```typescript
import { 
  // Validators
  isValidEmail,
  validatePassword,
  validateFileType,
  validateFileSize,
  // Formatters
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  formatFileSize,
  truncateText,
  slugify,
  // Rate limiting
  RateLimiter,
  rateLimit
} from 'nexora-engine'

// Email validation
const valid = isValidEmail('user@example.com') // boolean

// Password validation
const pwdCheck = validatePassword('MyP@ssw0rd')
// Returns: { isValid, errors, strength: 'weak' | 'medium' | 'strong' }

// File validation
const fileValid = validateFileType(file, ['image/jpeg', 'image/png'])
const sizeValid = validateFileSize(file, 5 * 1024 * 1024) // 5MB

// Date formatting
formatDate('2024-01-15') // "Jan 15, 2024"
formatDate(new Date(), 'long') // "Monday, January 15, 2024"
formatRelativeTime(new Date(Date.now() - 3600000)) // "1 hour ago"

// Text formatting
truncateText('Long text here...', 10) // "Long text..."
slugify('Hello World!') // "hello-world"

// File size formatting
formatFileSize(1536) // "1.5 KB"
```

### Error Handling

Nexora Engine provides a hierarchy of error classes.

```typescript
import { 
  NexoraError,
  AuthError,
  DatabaseError,
  ValidationError,
  CacheError,
  RateLimitError,
  TimeoutError,
  ForbiddenError,
  StorageError
} from 'nexora-engine'

try {
  const { data, error } = await fetchAll('users')
  
  if (error) {
    // Handle Supabase error
    console.error('Database error:', error)
  }
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.fieldErrors)
  } else if (error instanceof AuthError) {
    console.error('Auth error:', error.message)
  } else if (error instanceof DatabaseError) {
    console.error('Database error:', error.message)
    console.error('Details:', error.details)
  } else if (error instanceof NexoraError) {
    console.error('Nexora error:', error.code, error.message)
    console.error('Timestamp:', error.timestamp)
  }
}

// Creating custom errors
throw new ValidationError('Invalid input', {
  fieldErrors: { email: ['Invalid email format'] },
  details: { providedValue: 'not-an-email' }
})

throw new DatabaseError('Query failed', {
  cause: originalError,
  details: { query: 'SELECT * FROM users' }
})
```

**Error Hierarchy:**
```
NexoraError (base)
├── AuthError (401)
├── DatabaseError (400)
├── ValidationError (422)
├── CacheError
├── RateLimitError (429)
├── TimeoutError (408)
├── ForbiddenError (403)
└── StorageError
```

### Realtime

Nexora Engine provides a comprehensive realtime system with database change subscriptions, broadcast messaging, presence tracking, and connection management.

#### Database Change Subscriptions

```typescript
import { 
  subscribeToTable,
  subscribeToRow,
  unsubscribe,
  unsubscribeAll,
  getChannels,
  getConnectionState,
  realtime
} from 'nexora-engine'

// Subscribe to all changes on a table
const handle = subscribeToTable(
  { table: 'users', event: '*', schema: 'public' },
  {
    onInsert: (data) => console.log('New user:', data),
    onUpdate: (data) => console.log('Updated user:', data),
    onDelete: (data) => console.log('Deleted user:', data),
    onAll: (change) => console.log('Any change:', change.eventType, change.new, change.old),
    onSubscribed: (info) => console.log('Subscribed!', info.key),
    onTimedOut: () => console.log('Subscription timed out'),
    onClosed: () => console.log('Subscription closed'),
    onError: (error) => console.error('Realtime error:', error),
  }
)

// Subscribe to a specific row only
const rowHandle = subscribeToRow('users', 'user-123', {
  onUpdate: (data) => console.log('User 123 updated:', data),
  onSubscribed: () => console.log('Watching user 123'),
})

// Check subscription status
handle.isSubscribed() // boolean
handle.getState()     // 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED'

// Unsubscribe
await unsubscribe(handle)

// Subscribe to multiple tables with different callbacks
const handles = subscribeToTables([
  {
    config: { table: 'users', event: 'INSERT' },
    callbacks: { onInsert: (data) => console.log('New user:', data) },
  },
  {
    config: { table: 'posts', event: '*' },
    callbacks: {
      onInsert: (data) => console.log('New post:', data),
      onUpdate: (data) => console.log('Updated post:', data),
    },
  },
])
```

#### Connection Management

```typescript
// Monitor connection state
const state = getConnectionState() // 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

// Listen to connection changes
const cleanup = onConnectionChange((state) => {
  console.log('Connection state:', state)
})
// Call cleanup() to stop listening

// List all active channels
const channels = getChannels()
// Returns: [{ key, channel, type, state, subscribedAt }, ...]

// Get subscribed channels only
const subscribed = realtime.getSubscribedChannels()

// Reconnect all channels
await realtime.reconnect()

// Unsubscribe from everything
await unsubscribeAll()
```

#### Broadcast Channels

Client-to-client messaging without database involvement:

```typescript
import { createBroadcastChannel } from 'nexora-engine'

const channel = createBroadcastChannel('chat-room')

// Register event handlers BEFORE subscribing
channel
  .on('message', (payload) => {
    console.log('Received message:', payload)
  })
  .on('typing', (payload) => {
    console.log('User typing:', payload)
  })
  .subscribe() // Connect to the channel

// Send messages
await channel.send('message', { text: 'Hello!', userId: '123' })
await channel.send('typing', { userId: '123' })

// Check state
channel.isSubscribed() // boolean
channel.getState()     // 'SUBSCRIBED' | 'CHANNEL_ERROR' | ...

// Disconnect
await channel.unsubscribe()
```

#### Presence Channels

Track who is online in real-time:

```typescript
import { createPresenceChannel } from 'nexora-engine'

const presence = createPresenceChannel('chat-room')

// Join the channel and start tracking
const cleanup = await presence.subscribe(
  'user-123',
  { name: 'John', avatar: '/avatar.jpg' },
  {
    onSync: (users) => {
      console.log('All online users:', users)
    },
    onJoin: (users) => {
      console.log('User joined:', users)
    },
    onLeave: (users) => {
      console.log('User left:', users)
    },
    onSubscribed: () => console.log('Connected to presence channel'),
    onError: (error) => console.error('Presence error:', error),
  }
)

// Get current presence state
const onlineUsers = presence.getState()
const onlineCount = presence.getPresenceCount()
const isTracking = presence.isTracking()

// Leave the channel
await cleanup() // Calls untrack() then unsubscribe()

// Or just untrack (stay connected but go invisible)
await presence.untrack()

// Or fully disconnect
await presence.unsubscribe()
```

#### RealtimeManager

Unified realtime management:

```typescript
import { realtime } from 'nexora-engine'

// All operations available through the manager
const dbHandle = realtime.subscribeToTable({ table: 'posts', event: 'INSERT' }, {
  onInsert: (data) => console.log('New post:', data),
})

const broadcast = realtime.createBroadcastChannel('notifications')
const presence = realtime.createPresenceChannel('room-1')

const state = realtime.getConnectionState()
const channels = realtime.getChannels()

await realtime.reconnect()
await realtime.unsubscribeAll()

// Cleanup when done
realtime.destroy()
```

**Realtime Features Summary:**

| Feature | Description |
|---------|-------------|
| Database subscriptions | Listen to INSERT/UPDATE/DELETE on tables or specific rows |
| Broadcast channels | Client-to-client messaging without database |
| Presence channels | Track online users with join/leave events |
| Connection monitoring | Track connection state changes |
| Channel management | List, inspect, and manage all active channels |
| Auto-reconnect | Reconnect all channels after disconnection |
| State callbacks | onSubscribed, onTimedOut, onClosed for lifecycle events |
| Row-level filtering | Subscribe to changes on specific rows only |

## Advanced Usage

### Working with Transactions (Sequential Operations)

```typescript
import { runSequential } from 'nexora-engine'

const results = await runSequential([
  // These operations run in sequence
  { table: 'orders', operation: 'insert', data: { user_id: '123', total: 100 } },
  { table: 'order_items', operation: 'insert', data: { order_id: '{{0.id}}', product: 'Item 1' } },
  { table: 'inventory', operation: 'update', conditions: { id: 'item-1' }, data: { stock: 9 } }
])

// Use results from previous operations with {{index.property}} syntax
```

### Bulk Operations

```typescript
import { bulkInsert, bulkUpdate } from 'nexora-engine'

// Bulk insert
await bulkInsert('users', [
  { name: 'User 1', email: 'user1@example.com' },
  { name: 'User 2', email: 'user2@example.com' }
])

// Bulk update
await bulkUpdate('users', [
  { id: '1', data: { status: 'active' } },
  { id: '2', data: { status: 'inactive' } }
])
```

### Using the Pipeline Directly

```typescript
import { executeRequest } from 'nexora-engine'

// Execute with timeout and retry
const result = await executeRequest(
  async (signal) => {
    // Your async operation
    const response = await fetch('https://api.example.com', { signal })
    return response.json()
  },
  {
    timeout: 30000,    // 30 second timeout
    retries: 3,        // Retry up to 3 times
    retryDelay: 1000,  // Wait 1 second between retries
    signal: abortController.signal
  }
)
```

### Rate Limiting

```typescript
import { RateLimiter, rateLimit } from 'nexora-engine'

// Create rate limiter
const limiter = new RateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 100,     // Max 100 requests per minute
  message: 'Too many requests'
})

// Check rate limit
try {
  const { allowed, remaining, resetAt } = await limiter.check('user-123')
  if (allowed) {
    // Proceed with request
  }
} catch (error) {
  // Rate limit exceeded
}

// Or use the simple function
const result = await rateLimit('user-123', {
  windowMs: 60 * 1000,
  maxRequests: 100
})
```

## AI Skills System

Nexora Engine includes an AI Skills System with documentation in multiple formats (Markdown, YAML, JSON) to help AI assistants understand and use the library effectively.

### Available Skills

1. **Query Engine** (`skills/01-query-engine.*`) - Building and executing queries
2. **CRUD Operations** (`skills/02-crud-operations.*`) - Create, read, update, delete operations
3. **Caching System** (`skills/03-caching-system.*`) - Cache management and invalidation
4. **Validation System** (`skills/04-validation-system.*`) - Data validation with Zod
5. **Auth System** (`skills/05-auth-system.*`) - Authentication and authorization
6. **Error Handling** (`skills/06-error-handling.*`) - Error types and handling strategies
7. **SDK Architecture** (`skills/07-sdk-architecture.*`) - Library structure and design
8. **Performance Optimization** (`skills/08-performance-optimization.*`) - Optimization techniques

### Using Skills

The skills files are included in the npm package under the `skills/` directory. AI tools can reference these files to understand the library's capabilities.

```typescript
// Skills are automatically included when you install the package
// Located at: node_modules/nexora-engine/skills/
```

## Examples

### Complete CRUD Example

```typescript
import { 
  createNexoraClient,
  insertOne,
  fetchAll,
  fetchById,
  updateById,
  deleteById
} from 'nexora-engine'

// Initialize
createNexoraClient({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_ANON_KEY!
})

// Create
async function createPost(title: string, content: string) {
  const { data, error } = await insertOne('posts', {
    title,
    content,
    published: false,
    created_at: new Date().toISOString()
  })
  
  if (error) throw error
  return data
}

// Read
async function getPosts(page = 1) {
  const { data, error, count } = await fetchAll('posts', {
    select: 'id, title, created_at',
    filters: [{ column: 'published', operator: 'eq', value: true }],
    orderBy: [{ column: 'created_at', ascending: false }],
    limit: 10,
    offset: (page - 1) * 10
  })
  
  if (error) throw error
  return { posts: data, total: count }
}

// Update
async function publishPost(id: string) {
  await updateById('posts', id, {
    published: true,
    published_at: new Date().toISOString()
  })
}

// Delete
async function deletePost(id: string) {
  await deleteById('posts', id)
}
```

### Authentication Flow Example

```typescript
import { 
  signUp,
  signInWithPassword,
  getSession,
  onAuthStateChange,
  signOut 
} from 'nexora-engine'

class AuthService {
  // Sign up new user
  async register(email: string, password: string) {
    const { data, error } = await signUp({
      email,
      password,
      options: {
        data: { role: 'user' }
      }
    })
    
    if (error) throw error
    return data
  }
  
  // Sign in
  async login(email: string, password: string) {
    const { data, error } = await signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  }
  
  // Check auth state
  async isLoggedIn() {
    const { data: { session } } = await getSession()
    return !!session
  }
  
  // Listen to auth changes
  onAuthChange(callback: (event: string, session: any) => void) {
    return onAuthStateChange((event, session) => {
      callback(event, session)
    })
  }
  
  // Logout
  async logout() {
    await signOut()
  }
}
```

### Query Engine with Caching Example

```typescript
import { queryEngine } from 'nexora-engine'

class UserService {
  // Get users with caching
  async getActiveUsers() {
    return queryEngine.query({
      table: 'users',
      columns: 'id, name, email, avatar_url',
      filters: [
        { column: 'active', operator: 'eq', value: true }
      ],
      sort: [{ column: 'name', ascending: true }],
      ttl: 300000 // Cache for 5 minutes
    })
  }
  
  // Get paginated user list
  async getUsersPage(page: number) {
    return queryEngine.queryPaginated({
      table: 'users',
      page,
      pageSize: 20,
      ttl: 60000
    })
  }
  
  // Invalidate cache when user updates
  async updateUser(id: string, data: Partial<User>) {
    const result = await updateById('users', id, data)
    queryEngine.invalidateTable('users') // Clear cache
    return result
  }
}
```

## TypeScript Support

Nexora Engine is written in TypeScript and provides full type support.

### Generic Types

```typescript
import { fetchAll, fetchById } from 'nexora-engine'

// Define your types
interface User {
  id: string
  name: string
  email: string
  created_at: string
}

// Use with type parameter
const { data } = await fetchAll<User>('users')
// data is now typed as User[] | null

const { data: user } = await fetchById<User>('users', 'user-123')
// user is typed as User | null
```

### GenericRow Type

All table row types should extend `GenericRow`:

```typescript
import type { GenericRow } from 'nexora-engine'

interface User extends GenericRow {
  name: string
  email: string
  // id, created_at, updated_at, deleted_at are optional from GenericRow
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Documentation: [GitHub Wiki](https://github.com/AhmedAl-Bahrawy/NexoraEngine/wiki)
- Issues: [GitHub Issues](https://github.com/AhmedAl-Bahrawy/NexoraEngine/issues)
- Discussions: [GitHub Discussions](https://github.com/AhmedAl-Bahrawy/NexoraEngine/discussions)

---

Built with ❤️ using [Supabase](https://supabase.com)
