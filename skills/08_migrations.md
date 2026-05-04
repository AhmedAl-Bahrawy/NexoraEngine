# Skill 08: Migrations

## Template Core Files
- `supabase/migrations/0001_initial_schema.sql` - Base schema (todos, profiles)
- `supabase/migrations/0002_storage_files.sql` - Storage files tracking table
- `supabase/migrations/0003_teams_system.sql` - Teams, team_members, team RLS

## Migration Architecture

### Migration 0001: Initial Schema
Creates the foundational tables:
- **todos**: id, user_id, team_id (nullable), title, completed, created_at, updated_at
- **profiles**: id (references auth.users), full_name, avatar_url, created_at, updated_at
- Basic RLS policies for personal todos

### Migration 0002: Storage Files
Creates the `storage_files` table for tracking file metadata:
- **storage_files**: id, user_id, team_id (nullable), bucket_id, path, file_name, file_size, content_type, public_url, created_at, updated_at
- RLS policies matching todos pattern (personal + team)
- Creates a test storage bucket
- Realtime enabled for the table

### Migration 0003: Teams System
Creates the multi-tenant team infrastructure:
- **teams**: id, name, created_by, created_at, updated_at
- **team_members**: id, team_id, user_id, role (owner/admin/member), joined_at, user_email (via trigger)
- Team-aware RLS on todos (extends 0001 policies)
- Team-aware RLS on storage_files
- Team realtime channels
- Triggers to populate user_email in team_members

## Applying Migrations

### Local Development
```bash
supabase start          # Start local Supabase
supabase db reset       # Apply all migrations fresh
```

### Remote/Production
```bash
supabase link --project-ref YOUR_PROJECT_REF  # Link to project
supabase db push        # Push pending migrations
```

### Check Status
```bash
supabase migration list
```

## Creating New Migrations
```bash
supabase migration new your_migration_name
# Creates: supabase/migrations/XXXX_your_migration_name.sql
```

## Migration Best Practices
1. **Always write reversible migrations** - include DROP statements in comments
2. **Never modify existing migrations** - create a new one instead
3. **Test locally first** - `supabase db reset` then test your app
4. **Include RLS in every migration** - tables without RLS are security risks
5. **Enable realtime explicitly** - `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;` + publication
6. **Use IF NOT EXISTS** - makes migrations idempotent

## Example Migration Structure
```sql
-- Migration: 0004_new_feature.sql
-- Description: Add new feature table with RLS

-- 1. Create table
CREATE TABLE IF NOT EXISTS new_feature (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE new_feature ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
CREATE POLICY "Users can view own new_feature" ON new_feature
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = new_feature.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- 4. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE new_feature;

-- 5. Create indexes
CREATE INDEX idx_new_feature_user_id ON new_feature(user_id);
CREATE INDEX idx_new_feature_team_id ON new_feature(team_id);
```

## Rolling Back
Supabase CLI doesn't support automatic rollback. Manual rollback:
```sql
-- In Supabase SQL editor or via migration
DROP TABLE IF EXISTS new_feature CASCADE;
```

## Type Generation
After applying migrations, regenerate TypeScript types:
```bash
supabase gen types typescript --project-id YOUR_REF > src/types/database.ts
```
