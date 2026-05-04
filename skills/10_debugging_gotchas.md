# Skill 10: Debugging & Common Issues

## Error Handling Flow

### How Errors Are Processed
```
Supabase operation fails
    ↓
Error caught by try/catch
    ↓
handleSupabaseError(err) detects error type
    ↓
Returns appropriate error class (AuthError, DatabaseError, StorageError, ValidationError)
    ↓
formatErrorForDisplay(err) for UI
    ↓
getErrorSuggestion(err) for user guidance
```

### Common Error Codes

| Code | Type | Cause | Solution |
|------|------|-------|----------|
| `invalid_credentials` | Auth | Wrong email/password | Check credentials |
| `email_not_confirmed` | Auth | User hasn't verified email | Resend confirmation |
| `user_not_found` | Auth | No account with email | Sign up first |
| `weak_password` | Auth | Password too simple | Use 8+ chars, mixed case, numbers, symbols |
| `rate_limit_exceeded` | Auth | Too many attempts | Wait and retry |
| `not_found` | Database | Record doesn't exist | Check ID |
| `duplicate_entry` | Database | Unique constraint violation | Use different value |
| `permission_denied` | Database/Storage | RLS blocks access | Check RLS policies |
| `file_too_large` | Storage | Exceeds size limit | Reduce file size |
| `invalid_file_type` | Storage | Unsupported mime type | Check allowed types |

## Debugging Checklist

### 1. Client Not Connecting
```typescript
// Check env vars
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)

// Check client initialization
import { supabase } from './lib/auth'
const { data, error } = await supabase.from('todos').select('*').limit(1)
console.log(data, error)
```

### 2. Auth Issues
```typescript
// Check session
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)

// Check user
const { data: { user } } = await supabase.auth.getUser()
console.log('User:', user)

// Listen to auth events
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session)
})
```

### 3. RLS Blocking Data
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies WHERE schemaname = 'public';

-- Test as specific user
SET request.jwt.claims = '{"sub": "user-uuid"}';
SELECT * FROM todos;  -- Should return user's todos
```

### 4. Realtime Not Working
```typescript
// Check subscription status
const channel = supabase.channel('test')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, (payload) => {
    console.log('Realtime event:', payload)
  })
  .subscribe((status) => {
    console.log('Subscription status:', status)
  })

// Check realtime is enabled on table
-- In SQL editor:
SELECT * FROM pg_publication_tables;
```

### 5. Cache Not Updating
```typescript
// Debug TanStack Query
import { useQueryClient } from '@tanstack/react-query'
const queryClient = useQueryClient()

// Log cache state
console.log(queryClient.getQueryCache().getAll())

// Force invalidate
queryClient.invalidateQueries({ queryKey: ['supabase', 'todos'] })

// Force refetch
queryClient.refetchQueries({ queryKey: ['supabase', 'todos'] })
```

### 6. File Upload Failing
```typescript
// Check bucket exists and is configured
// In Supabase dashboard → Storage → check bucket settings

// Check RLS on storage bucket
-- In SQL editor:
SELECT * FROM storage.buckets;

// Test upload
const { data, error } = await supabase.storage
  .from('test')
  .upload('test.txt', new Blob(['hello'], { type: 'text/plain' }))
console.log(data, error)
```

## Common Gotchas

### 1. Missing Environment Variables
The client throws `SupabaseError` if `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing. Check `.env` file.

### 2. RLS Not Enabled
Tables created via migrations may not have RLS enabled. Always include:
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### 3. Realtime Not Enabled
Tables need to be added to the `supabase_realtime` publication:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE table_name;
```

### 4. Query Key Mismatch
Cache invalidation requires exact query key match. Use the `queryKeys` factory:
```typescript
// Wrong - key mismatch
queryClient.invalidateQueries({ queryKey: ['todos', userId] })

// Correct - matches the hook's key
queryClient.invalidateQueries({ queryKey: queryKeys.todos.personal(userId) })
```

### 5. Stale Realtime Subscriptions
Always clean up subscriptions:
```typescript
useEffect(() => {
  const channel = subscribeToTable(...)
  return () => { unsubscribe(channel) }  // ← Don't forget this!
}, [userId])
```

### 6. TypeScript Type Mismatch
Generated types may not match your actual schema. Regenerate after migrations:
```bash
supabase gen types typescript --project-id YOUR_REF > src/types/database.ts
```

### 7. Session Persistence Issues
The client uses `persistSession: true` by default, but in some environments (incognito, third-party cookies disabled), localStorage may not work. Check:
```typescript
const { data, error } = await supabase.auth.getSession()
console.log('Stored session:', data.session)
```

## Performance Debugging

### 1. Slow Queries
```typescript
// Use the query builder to check the generated SQL
const query = supabase.from('todos').select('*').eq('user_id', userId)
// In Supabase dashboard → SQL Editor, paste equivalent query and check EXPLAIN ANALYZE
```

### 2. Too Many Realtime Channels
Each subscription creates a WebSocket connection. Monitor:
```typescript
console.log(supabase.channelList)  // Active channels
```

### 3. Cache Memory
TanStack Query caches data in memory. Configure gcTime to control cleanup:
```typescript
// In query/client.ts
gcTime: 1000 * 60 * 30,  // 30 minutes - cache cleared after 30 min of inactivity
```
