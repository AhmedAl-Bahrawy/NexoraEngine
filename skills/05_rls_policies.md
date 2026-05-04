# Skill 05: RLS Policies

## What is RLS
Row-Level Security (RLS) is PostgreSQL's row-level access control. Every query goes through RLS policies that determine which rows a user can see or modify. RLS is the security foundation of this template.

## RLS in This Template

### Todos Table
- **Personal todos**: `auth.uid() = user_id` - Users see only their own personal todos
- **Team todos**: User must be a member of the team (`team_members` table check)
- **Select Policy**: `(auth.uid() = user_id AND team_id IS NULL) OR EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = todos.team_id AND team_members.user_id = auth.uid())`
- **Insert Policy**: Same as select - must own the personal todo or be a team member
- **Update Policy**: Same as select
- **Delete Policy**: Same as select

### Teams Table
- **Select**: User must be a member via team_members
- **Insert**: Any authenticated user can create a team
- **Update**: Only team owner (`created_by = auth.uid()`)
- **Delete**: Only team owner

### Team Members Table
- **Select**: User must be a member of the team
- **Insert**: Any authenticated user can join (or be added by team member)
- **Update**: Team owner or admin can change roles
- **Delete**: User can remove themselves, or team owner/admin can remove others

### Storage Files Table
- **Personal files**: `auth.uid() = user_id AND team_id IS NULL`
- **Team files**: User must be a member of the team
- **Select**: `(auth.uid() = user_id AND team_id IS NULL) OR EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = storage_files.team_id AND team_members.user_id = auth.uid())`
- **Insert/Update/Delete**: Same as select

## RLS + Smart Queries
The smart query layer (`src/lib/query/`) automatically respects RLS because:
1. All queries use the authenticated Supabase client
2. RLS is enforced at the database level
3. No data bypasses RLS - even `fetchAll()` is filtered

## Realtime + RLS
Realtime subscriptions also respect RLS. If a user subscribes to a table, they only receive events for rows they have SELECT permission on.

## Testing RLS
To verify RLS works:
1. Create two user accounts
2. User A creates a personal todo
3. User B queries todos - should NOT see User A's todo
4. Both users join a team
5. User A creates a team todo
6. User B queries team todos - SHOULD see it

## Common RLS Patterns

### Personal Data
```sql
CREATE POLICY "Users can see own data" ON todos
  FOR SELECT USING (auth.uid() = user_id);
```

### Team Data
```sql
CREATE POLICY "Team members can see team data" ON todos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = todos.team_id
      AND team_members.user_id = auth.uid()
    )
  );
```

### Owner-Only Write
```sql
CREATE POLICY "Only owner can update" ON teams
  FOR UPDATE USING (auth.uid() = created_by);
```

## Important Notes
- RLS is enabled by default on tables created via the Supabase dashboard
- Tables created via migrations need `ALTER TABLE table ENABLE ROW LEVEL SECURITY;`
- `service_role` key bypasses RLS - NEVER expose it in client code
- Super admin role can bypass RLS - use carefully
