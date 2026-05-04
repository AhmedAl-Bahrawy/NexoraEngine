# 05 — Row Level Security (RLS) Policies

RLS is Supabase's permission system. Every table should have it enabled.
This file documents the patterns used **in this project** and how to fix common errors.

---

## 🛡️ The Golden Rules

1. **Always enable RLS** on every table you create.
2. **"No rows returned" with no error = RLS is blocking you** (not a code bug).
3. **403 Forbidden on INSERT/UPDATE = missing RLS policy** for that operation.
4. **Test policies in Supabase Dashboard → SQL Editor** before writing code.

---

## 🛡️ Pattern: Basic "Users own their rows"

```sql
-- Users can only see their own rows
CREATE POLICY "Users see own rows"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert rows for themselves
CREATE POLICY "Users insert own rows"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own rows
CREATE POLICY "Users update own rows"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own rows
CREATE POLICY "Users delete own rows"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 🛡️ Pattern: Team-based Access

```sql
-- A user can see spaces they own OR spaces in teams they belong to
CREATE POLICY "Users see own or team spaces"
  ON spaces FOR SELECT
  USING (
    auth.uid() = owner_id
    OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = spaces.team_id
      AND team_members.user_id = auth.uid()
    )
  );
```

---

## 🛡️ Pattern: Public Read, Authenticated Write

```sql
-- Anyone can read
CREATE POLICY "Public read"
  ON posts FOR SELECT USING (true);

-- Only authenticated users can insert
CREATE POLICY "Auth write"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

---

## 🛡️ Pattern: Allow Personal + Team ownership (used in this project)

This pattern was added to fix the 403 on `spaces` (see conversation 994b3ff9):

```sql
CREATE POLICY "Allow space creation"
  ON spaces FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
  );

CREATE POLICY "Allow space access"
  ON spaces FOR SELECT
  USING (
    auth.uid() = owner_id
    OR team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );
```

---

## 🔧 How to Add or Fix a Policy

1. Go to **Supabase Dashboard → Database → Row Level Security**.
2. Find your table.
3. Click **"New Policy"** → Use a template or write SQL manually.
4. Test with the SQL Editor:
   ```sql
   -- Simulate a user's perspective:
   SET LOCAL role = authenticated;
   SET LOCAL request.jwt.claims = '{"sub": "your-user-uuid"}';
   SELECT * FROM spaces;
   ```

---

## 🔧 Quick Fix: Temporarily Disable RLS (DEVELOPMENT ONLY)

```sql
-- ⚠️ NEVER do this in production
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
```

---

## ⚠️ Gotchas

| Symptom | Cause | Fix |
|---|---|---|
| `[]` data, no error | RLS SELECT policy missing or wrong | Add/fix SELECT policy |
| `403 Forbidden` on INSERT | RLS INSERT policy missing | Add INSERT policy with `WITH CHECK` |
| `403 Forbidden` on UPDATE | RLS UPDATE policy missing | Add UPDATE policy with `USING` |
| Data visible to all users | No RLS or `USING (true)` policy | Add `USING (auth.uid() = owner_id)` |
| Service role bypasses RLS | Using service key instead of anon key | Use anon key for client-side code |
