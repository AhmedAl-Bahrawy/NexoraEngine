# Operations Flow - Complete Function Map

## Architecture Layers

```
UI Components
    ↓ (call)
Smart Query Hooks (src/lib/query/hooks.ts) -- TanStack Query layer (caching, invalidation, realtime)
    ↓ (call)
Database Operations (src/lib/database/) -- Raw Supabase query/mutation functions
    ↓ (use)
Supabase Client (src/lib/auth/client.ts) -- Single configured client instance
```

---

## AUTH OPERATIONS (src/lib/auth/)

### Client (`client.ts`)
| Function | Purpose | Returns |
|----------|---------|---------|
| `supabase` | Configured Supabase client with auto-refresh, session persistence, URL detection | `SupabaseClient` |
| `getEnvVar(key)` | Validates and retrieves env var, throws SupabaseError if missing | `string` |

### Operations (`operations.ts`)
| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `signInWithPassword()` | Email/password authentication | `{ email, password }` | `{ user, session }` |
| `signUp()` | Create new account with validation | `{ email, password, metadata? }` | `{ user, session }` |
| `signOut()` | End session | none | `void` |
| `signInWithOTP()` | Passwordless email magic link | `email: string` | `void` |
| `signInWithOAuth()` | OAuth redirect (google, github, gitlab, azure, bitbucket, facebook) | `provider` | `{ url, provider }` |
| `resetPassword()` | Send password reset email | `email: string` | `void` |
| `updatePassword()` | Change password (requires auth) | `newPassword: string` | `void` |
| `updateUser()` | Update user attributes | `{ email?, password?, data? }` | `User` |
| `resendConfirmationEmail()` | Resend email verification | `email: string` | `void` |
| `getSession()` | Get current session from storage | none | `Session \| null` |
| `getUser()` | Get current user from server | none | `User \| null` |
| `isAuthenticated()` | Check if user has valid session | none | `boolean` |
| `refreshSession()` | Force session refresh | none | `Session \| null` |
| `exchangeCodeForSession()` | OAuth callback code exchange | `code: string` | `{ user, session }` |
| `signInAnonymously()` | Anonymous session | none | `{ user, session }` |
| `linkAnonymousAccount()` | Convert anonymous to permanent | `email, password` | `User` |

### MFA (`mfa.ts`)
| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `enrollTOTP()` | Start TOTP authenticator enrollment | `friendlyName?` | `{ id, type, qrCode, secret, uri }` |
| `challengeMFA()` | Generate MFA challenge | `factorId` | `{ id, expires_at }` |
| `verifyMFA()` | Verify MFA code | `factorId, code, challengeId?` | `{ user, accessToken, refreshToken }` |
| `unenrollMFA()` | Remove MFA factor | `factorId` | `void` |
| `listMFAFactors()` | List enrolled factors | none | `{ all, totp, phone }` |
| `getAuthenticatorAssuranceLevel()` | Get AAL level | none | `{ currentLevel, nextLevel, currentAuthenticationMethods }` |

### Admin (`admin.ts`) - SERVER-SIDE ONLY
| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `createUser()` | Create user (admin) | `{ email, password?, emailConfirm?, phone?, userMetadata?, appMetadata? }` | `User` |
| `deleteUser()` | Delete user (admin) | `userId` | `void` |
| `getUserById()` | Get user by ID (admin) | `userId` | `User` |
| `listUsers()` | List all users with pagination | `{ page?, perPage? }` | `{ users, total }` |
| `updateUserById()` | Update user by ID (admin) | `userId, attributes` | `User` |
| `inviteUserByEmail()` | Send invite email (admin) | `email, options?` | `User` |
| `generateLink()` | Generate auth link (admin) | `type, email, options?` | `{ properties: { action_link, email_otp, hashed_token, redirect_to, verification_type } }` |

---

## DATABASE OPERATIONS (src/lib/database/)

### Queries (`queries.ts`) - READ OPERATIONS
| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `fetchAll<T>(table, options?)` | Fetch records from any table with filtering, ordering, limits | `table, { columns?, filter?, order?, limit?, offset? }` | `T[]` |
| `fetchById<T>(table, id, options?)` | Fetch single record by ID | `table, id, { columns? }` | `T \| null` |
| `fetchWhere<T>(table, conditions, options?)` | Fetch with equality conditions | `table, { key: value }, { order?, limit? }` | `T[]` |
| `fetchPaginated<T>(table, options?)` | Paginated results with count | `table, { page?, pageSize?, columns?, filter?, order? }` | `{ data, count, page, pageSize, totalPages }` |
| `search<T>(table, column, searchTerm, options?)` | Case-insensitive ILIKE search | `table, column, searchTerm, { order?, limit? }` | `T[]` |
| `fullTextSearch<T>(table, searchColumn, searchTerm, options?)` | PostgreSQL full-text search | `table, searchColumn, searchTerm, { limit? }` | `T[]` |
| `count(table, options?)` | Count records | `table, { filter? }` | `number` |
| `exists(table, conditions)` | Check if record exists | `table, { key: value }` | `boolean` |
| `distinct<T>(table, column)` | Get unique values | `table, column` | `T[]` |
| `aggregate<T>(table, operation, column)` | Aggregate (avg/count/max/min/sum) | `table, operation, column` | `T` |
| `createQuery(table)` | Raw query builder | `table` | `{ select, insert, update, delete, upsert }` |

### Mutations (`mutations.ts`) - WRITE OPERATIONS
| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `insertOne<T>(table, data)` | Insert single record | `table, data` | `T` |
| `insertMany<T>(table, data)` | Insert multiple records | `table, data[]` | `T[]` |
| `updateById<T>(table, id, data)` | Update by ID | `table, id, data` | `T` |
| `updateWhere<T>(table, conditions, data)` | Update matching records | `table, { key: value }, data` | `T[]` |
| `upsert<T>(table, data, options?)` | Insert or update | `table, data, { onConflict? }` | `T` |
| `deleteById(table, id)` | Delete by ID | `table, id` | `void` |
| `deleteWhere(table, conditions)` | Delete matching records | `table, { key: value }` | `number` (count deleted) |
| `deleteMany(table, ids)` | Delete by ID list | `table, string[]` | `void` |
| `softDelete<T>(table, id)` | Soft delete (sets deleted_at) | `table, id` | `T` |
| `restore<T>(table, id)` | Restore soft-deleted | `table, id` | `T` |
| `bulkInsert<T>(table, items)` | Bulk insert | `table, items[]` | `T[]` |
| `bulkUpdate<T>(table, items)` | Bulk update | `table, [{ id, data }]` | `T[]` |
| `transaction<T>(operations)` | Sequential batch with rollback on error | `Array<() => Promise<T>>` | `T[]` |

### Realtime (`realtime.ts`) - LIVE SUBSCRIPTIONS
| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `subscribeToTable<T>(config, callbacks)` | Subscribe to postgres_changes | `{ table, event?, filter?, schema? }, { onInsert?, onUpdate?, onDelete?, onAll?, onError? }` | `RealtimeChannel` |
| `useSubscription<T>(config, callbacks, options?)` | Subscribe with auto-cleanup | Same as above + `{ enabled? }` | `() => void` (cleanup function) |
| `createBroadcastChannel(name)` | Cross-tab communication | `channelName` | `{ subscribe, send }` |
| `createPresenceChannel(name)` | Online user tracking | `channelName` | `{ subscribe, untrack }` |
| `unsubscribe(channel)` | Remove single channel | `RealtimeChannel` | `Promise<void>` |
| `unsubscribeAll()` | Remove all channels | none | `Promise<void>` |

### Teams (`teams.ts`) - MULTI-TENANCY
| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `createTeam(params)` | Create team (caller becomes owner) | `{ name }` | `Team` |
| `getUserTeams()` | Get all teams for current user | none | `(Team & { role })[]` |
| `getTeamMembers(teamId)` | Get team members with emails | `teamId` | `TeamMember[]` |
| `addTeamMember(params)` | Add member to team | `{ teamId, userId, role? }` | `TeamMember` |
| `updateMemberRole(teamId, userId, role)` | Change member role | `teamId, userId, role` | `TeamMember` |
| `removeTeamMember(teamId, userId)` | Remove member | `teamId, userId` | `void` |
| `leaveTeam(teamId)` | Self-leave team | `teamId` | `void` |
| `deleteTeam(teamId)` | Delete entire team | `teamId` | `void` |
| `getTeamById(teamId)` | Get team details | `teamId` | `Team \| null` |
| `subscribeToTeam(teamId, callbacks)` | Realtime for team todos + members | `teamId, { onTodoInsert?, onTodoUpdate?, onTodoDelete?, onMemberChange? }` | `RealtimeChannel[]` |
| `unsubscribeFromTeam(channels)` | Clean up team channels | `RealtimeChannel[]` | `Promise<void>` |

---

## STORAGE OPERATIONS (src/lib/storage/)

| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `uploadFile(bucket, path, file, options?)` | Upload with optional progress callback | `bucket, path, File, { upsert?, contentType?, cacheControl?, onProgress? }` | `{ path, fullPath }` |
| `uploadFileWithProgress(bucket, path, file, onProgress, options?)` | Upload with simulated progress UI | `bucket, path, File, (progress) => void, { upsert?, contentType?, cacheControl? }` | `{ path, fullPath }` |
| `uploadWithValidation(bucket, path, file, validator)` | Upload with custom validation | `bucket, path, File, (file) => { isValid, error? }` | `{ path, fullPath }` |
| `uploadImage(bucket, path, file)` | Upload image (auto-validates) | `bucket, path, File` | `{ path, fullPath }` |
| `uploadDocument(bucket, path, file)` | Upload document (auto-validates) | `bucket, path, File` | `{ path, fullPath }` |
| `getPublicUrl(bucket, path)` | Get permanent public URL | `bucket, path` | `string` |
| `getSignedUrl(bucket, path, expiresIn?)` | Get temporary signed URL | `bucket, path, seconds?` | `Promise<string>` |
| `downloadFile(bucket, path)` | Download file as Blob | `bucket, path` | `Promise<Blob>` |
| `deleteFile(bucket, path)` | Delete single file | `bucket, path` | `Promise<void>` |
| `deleteFiles(bucket, paths)` | Delete multiple files | `bucket, string[]` | `Promise<void>` |
| `listFiles(bucket, path?)` | List files in bucket/path | `bucket, path?` | `Promise<StorageObject[]>` |
| `moveFile(bucket, fromPath, toPath)` | Move/rename file | `bucket, fromPath, toPath` | `Promise<{ message }>` |
| `copyFile(bucket, fromPath, toPath)` | Copy file | `bucket, fromPath, toPath` | `Promise<{ path }>` |
| `getFileInfo(bucket, path)` | Get file metadata | `bucket, path` | `Promise<{ size, lastModified, contentType, cacheControl }>` |
| `createFolder(bucket, folderPath)` | Create folder placeholder | `bucket, folderPath` | `Promise<void>` |
| `uploadFromURL(bucket, path, url)` | Upload from remote URL | `bucket, path, url` | `Promise<{ path, fullPath }>` |

---

## SMART QUERY HOOKS (src/lib/query/hooks.ts) - TEMPLATE CORE

### Todo Hooks
| Hook | Type | Purpose | Returns |
|------|------|---------|---------|
| `usePersonalTodos(userId?)` | Query | Fetch personal todos with caching | `{ data, isLoading, error, refetch }` |
| `useTeamTodos(teamId?)` | Query | Fetch team todos with caching | `{ data, isLoading, error, refetch }` |
| `usePersonalTodosRealtime(userId?)` | Realtime | Subscribe to personal todo changes, auto-updates cache | `void` |
| `useTeamTodosRealtime(teamId?)` | Realtime | Subscribe to team todo changes, auto-updates cache | `void` |
| `useCreateTodo()` | Mutation | Create todo, auto-inserts into cache | `useMutation` result |
| `useToggleTodo()` | Mutation | Toggle completed, auto-updates cache | `useMutation` result |
| `useDeleteTodo()` | Mutation | Delete todo, auto-removes from cache | `useMutation` result |

### Team Hooks
| Hook | Type | Purpose | Returns |
|------|------|---------|---------|
| `useUserTeams(userId?)` | Query | Fetch user's teams | `{ data, isLoading, error, refetch }` |
| `useTeamMembers(teamId?)` | Query | Fetch team members | `{ data, isLoading, error, refetch }` |
| `useTeamMembersRealtime(teamId?)` | Realtime | Subscribe to member changes, invalidates cache | `void` |
| `useCreateTeam()` | Mutation | Create team, invalidates teams cache | `useMutation` result |
| `useAddTeamMember()` | Mutation | Add member, invalidates members cache | `useMutation` result |
| `useUpdateMemberRole()` | Mutation | Change role, invalidates members cache | `useMutation` result |
| `useRemoveTeamMember()` | Mutation | Remove member, invalidates members cache | `useMutation` result |
| `useLeaveTeam()` | Mutation | Leave team, invalidates teams cache | `useMutation` result |

### Storage File Hooks
| Hook | Type | Purpose | Returns |
|------|------|---------|---------|
| `usePersonalStorageFiles(userId?)` | Query | Fetch personal file metadata | `{ data, isLoading, error, refetch }` |
| `useTeamStorageFiles(teamId?)` | Query | Fetch team file metadata | `{ data, isLoading, error, refetch }` |
| `useStorageFilesRealtime(userId?, teamId?)` | Realtime | Subscribe to file changes, invalidates cache | `void` |
| `useCreateStorageFile()` | Mutation | Create file record, auto-inserts into cache | `useMutation` result |
| `useDeleteStorageFile()` | Mutation | Delete file record, auto-removes from cache | `useMutation` result |

---

## GENERIC HOOKS (src/hooks/) - TEMPLATE CORE (Alternative Pattern)

### useSupabase.ts
| Hook | Purpose | Returns |
|------|---------|---------|
| `useSupabase()` | Direct Supabase client access | `SupabaseClient` |
| `useFetch<T>(table, options?)` | useState-based data fetching | `{ data, loading, error, refetch, setData }` |
| `useFetchOne<T>(table, match, options?)` | Single record fetching | `{ data, loading, error, refetch, setData }` |
| `useInsert<T>(table)` | Insert operation | `{ insert, loading, error }` |
| `useUpdate<T>(table)` | Update operation | `{ update, updateById, loading, error }` |
| `useDelete(table)` | Delete operation | `{ remove, removeById, loading, error }` |
| `useRealtime<T>(table, callback, filter?)` | Live subscription | `{ connected, error }` |
| `useLiveQuery<T>(table, options?)` | Fetch + Realtime combined | `{ data, loading, error, refetch }` |
| `usePagination<T>(table, options?)` | Paginated loading | `{ data, loading, error, page, pageSize, totalPages, totalCount, hasMore, nextPage, prevPage, goToPage, refresh }` |
| `useOptimisticUpdate<T>(table, initialData?)` | Optimistic UI updates | `{ data, setData, loading, error, optimisticInsert, optimisticUpdate, optimisticDelete }` |
| `useStorage(bucket)` | Storage operations | `{ upload, getPublicUrl, remove, list, uploading, error }` |
| `useRpc<T>(functionName)` | RPC function calls | `{ execute, data, loading, error }` |
| `useBatch<T>(table)` | Batch operations | `{ batchInsert, batchUpdate, batchDelete, loading, error }` |
| `useSearch<T>(table, column, options?)` | Debounced search | `{ query, setQuery, data, loading, error }` |
| `useRawQuery<T>()` | Raw SQL via RPC | `{ execute, data, loading, error }` |
| `useCount(table, options?)` | Record counting | `{ count, loading, error, refetch }` |
| `useAggregate<T>(table, aggregation, options?)` | Aggregation queries | `{ data, loading, error, refetch }` |
| `useJoin<T>(primaryTable, joins, options?)` | Joined queries | `{ data, loading, error, refetch }` |

### useAuth.tsx
| Hook/Component | Purpose | Returns |
|----------------|---------|---------|
| `AuthProvider` | Context provider for auth state | React component |
| `useAuth()` | Auth context access | `{ user, session, loading, error, isAuthenticated, signIn, signUp, signInWithMagicLink, signInWithProvider, signOut, resetPassword, updateUser, resendConfirmation, refreshUser, clearError }` |
| `useRequireAuth(redirectTo?)` | Protected route guard | `{ isAuthenticated, loading }` |
| `useIsAdmin()` | Check admin role | `boolean` |
| `useUserMetadata<T>()` | User metadata access | `T \| undefined` |
| `useOAuthCallback()` | Handle OAuth redirect | `{ handleCallback, loading, error }` |
| `usePasswordReset()` | Password reset flow | `{ sendResetLink, updatePassword, loading, error, success }` |
| `useSession()` | Session management | `{ session, user, isExpiring, refresh, expiresAt }` |
| `useMFA()` | MFA management | `{ enroll, verify, unenroll, challenge, listFactors, factorId, loading, error }` |
| `useAnonymousAuth()` | Anonymous auth | `{ signInAnonymously, linkIdentity, loading, error }` |
| `useIdentityLinking()` | OAuth identity linking | `{ linkIdentity, unlinkIdentity, identities, loading, error }` |
| `useUserInvitations()` | Admin invitations | `{ inviteUser, loading, error }` |
| `useNonceAuth()` | Nonce-based auth | `{ signInWithNonce, loading, error }` |

---

## ERROR HANDLING FLOW

```
Any Supabase Operation
    ↓ (error occurs)
handleSupabaseError(error)
    ↓ (detects error type via type guards)
    ├── isPostgrestError → DatabaseError
    ├── isAuthError → AuthError
    ├── isStorageError → StorageError
    └── unknown → SupabaseError
    ↓
formatErrorForDisplay(error) → { title, message, suggestion, code }
    ↓
getErrorSuggestion(error) → user-friendly suggestion string
```

## SMART QUERY DATA FLOW

```
User Action (e.g., click "Add Todo")
    ↓
Mutation Hook (useCreateTodo.mutateAsync)
    ↓
Database Operation (insertOne('todos', data))
    ↓
onSuccess callback
    ├── Updates cache: queryClient.setQueryData(queryKey, ...)
    └── OR invalidates: invalidate.todos(...)
    ↓
UI automatically re-renders with new data

---

Realtime Event (INSERT/UPDATE/DELETE)
    ↓
Realtime Hook (usePersonalTodosRealtime)
    ↓
subscribeToTable callback
    ↓
Direct cache update: queryClient.setQueryData(queryKey, ...)
    ↓
UI updates instantly (no network request)
```
