# 08 — Database Migrations

**Location:** `supabase/migrations/`
**Naming:** `YYYYMMDDHHMMSS_description.sql` (timestamp prefix is required)

---

## 🗄️ What is a Migration?

A migration is a SQL file that describes a **change to the database schema**.
Every time you need a new table, column, or index — you write a migration.

---

## 🗄️ Pattern: Create a New Migration

```bash
# From the project root:
supabase migration new my_new_feature
```

This creates a new file in `supabase/migrations/` with the correct timestamp prefix.

---

## 🗄️ Pattern: Basic Migration Structure

```sql
-- supabase/migrations/20260504000000_create_comments.sql

-- 1. Create the table
CREATE TABLE IF NOT EXISTS comments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS immediately
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 3. Add policies
CREATE POLICY "Users see all comments on their tasks"
  ON comments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = comments.task_id AND tasks.user_id = auth.uid())
  );

CREATE POLICY "Users insert own comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Add indexes for performance
CREATE INDEX comments_task_id_idx ON comments(task_id);
CREATE INDEX comments_user_id_idx ON comments(user_id);
```

---

## 🗄️ Pattern: Add a Column to Existing Table

```sql
-- Always use IF NOT EXISTS to make it re-runnable safely
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
```

---

## 🗄️ Pattern: Apply Migrations

```bash
# Push all pending migrations to the remote Supabase project:
supabase db push

# Or apply locally (requires local Supabase running):
supabase db reset
```

---

## 🗄️ Pattern: Check Migration Status

```bash
supabase migration list
```

---

## 🗄️ Pattern: Generate Types After Schema Change

After applying a migration, regenerate TypeScript types:
```bash
supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
```

---

## ⚠️ Gotchas

| Problem | Fix |
|---|---|
| Migration fails with "column already exists" | Use `ADD COLUMN IF NOT EXISTS` |
| Migration fails with "table already exists" | Use `CREATE TABLE IF NOT EXISTS` |
| Wrong column name causes failure | Check actual schema with `\d table_name` in SQL Editor |
| Migrations out of order | Never rename migration files — timestamp order matters |
| `student_id` vs `user_id` error | Always check the actual column name in the Dashboard first |

---

## 📋 New Table Checklist

When creating any new table, always include:
- [ ] `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`
- [ ] `created_at TIMESTAMPTZ DEFAULT NOW()`
- [ ] `user_id UUID REFERENCES auth.users(id)` (if user-owned)
- [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- [ ] RLS policies for SELECT, INSERT, UPDATE, DELETE
- [ ] Indexes on foreign key columns
