# 09 — Debugging & Gotchas

This is the most important file. Every time you fix a confusing bug, log it here.

---

## 🐛 Error: 403 Forbidden on CREATE/INSERT

**When:** Trying to create a space, task, or board and getting a 403.
**Cause:** RLS INSERT policy is missing or `WITH CHECK` condition fails.
**Fix:**
```sql
CREATE POLICY "Allow insert for owner"
  ON spaces FOR INSERT
  WITH CHECK (auth.uid() = owner_id);
```
> This project hit this bug on `spaces`, `tasks`, and `boards` (see conversation 994b3ff9).

---

## 🐛 `.single()` returns 406 error

**When:** Using `.single()` and getting error code `PGRST116`.
**Cause:** The query returned 0 rows or more than 1 row.
**Fix:** Use `.maybeSingle()` if the row might not exist:
```ts
const { data } = await supabase.from('spaces').select('*').eq('id', id).maybeSingle();
// data will be null if not found, instead of throwing
```

---

## 🐛 Data is empty `[]` but no error is shown

**When:** A query returns `[]` with no error.
**Cause:** RLS SELECT policy is blocking the query silently.
**Fix:** Go to Supabase Dashboard → SQL Editor and run:
```sql
SELECT * FROM your_table; -- as service role to see if data exists
```
Then check if your SELECT policy uses `auth.uid()` correctly.

---

## 🐛 Realtime not working (no live updates)

**When:** Subscribed to a table but changes aren't coming through.
**Cause 1:** Replication is not enabled for the table.
**Fix 1:** Go to Supabase Dashboard → Database → Replication → enable your table.

**Cause 2:** Forgot to call `.subscribe()`.
**Fix 2:** Add `.subscribe()` at the end of the channel chain.

**Cause 3:** Component unmounted before subscription was set up.
**Fix 3:** Always clean up with `supabase.removeChannel(channel)` in useEffect return.

---

## 🐛 Migration fails: wrong column name

**When:** Migration references `student_id` but the actual column is `user_id`.
**Fix:** Always verify column names in the Dashboard first:
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'enrollments';
```
> This project hit this on the `enrollments` table (see conversation 72cec3e9).

---

## 🐛 Auth user is `null` on first render

**When:** `useAuth().user` is null even though user is logged in.
**Cause:** Auth state is async — it takes a moment to load from the session.
**Fix:** Always check `loading` first:
```tsx
const { user, loading } = useAuth();
if (loading) return <Spinner />;
if (!user) return <Navigate to="/login" />;
```

---

## 🐛 PATCH request fails with `406 Not Acceptable`

**When:** Doing an UPDATE and getting a 406.
**Cause:** The `.select()` after `.update()` is returning multiple rows when `.single()` expects one.
**Fix:**
```ts
// Make sure your filter is unique:
.update({ status: 'done' })
.eq('id', taskId)  // must be a unique column
.select()
.single()
```
> This project hit this bug (see conversation d0082c72).

---

## 🐛 Supabase OAuth redirect not working

**When:** After OAuth sign in, user gets redirected to wrong URL.
**Fix:** Add the redirect URL to **Supabase Dashboard → Auth → URL Configuration → Redirect URLs**.
Example: `http://localhost:5173/**`

---

## 🐛 Types are out of sync with the database

**When:** TypeScript errors about missing columns or wrong types after a migration.
**Fix:** Regenerate types:
```bash
supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
```

---

## 📝 Template: Add a New Bug Entry

Copy this when you fix a new bug:

```
## 🐛 [Short description of the error]

**When:** [What were you doing?]
**Cause:** [Why did it happen?]
**Fix:**
[code or steps to fix]
```
