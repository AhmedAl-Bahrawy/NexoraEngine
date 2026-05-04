# Skill 09: Teams System

## Template Core Files
- `src/lib/database/teams.ts` - Team operations
- `supabase/migrations/0003_teams_system.sql` - Database schema + RLS

## Database Schema

### teams Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, auto-generated |
| name | TEXT | Team display name |
| created_by | UUID | Reference to auth.users (creator is owner) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### team_members Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, auto-generated |
| team_id | UUID | Reference to teams(id) |
| user_id | UUID | Reference to auth.users(id) |
| role | TEXT | 'owner', 'admin', or 'member' |
| joined_at | TIMESTAMPTZ | Join timestamp |
| user_email | TEXT | Populated by trigger from auth.users |

## Roles & Permissions

| Role | Can View | Can Edit | Can Manage Members | Can Delete Team |
|------|----------|----------|-------------------|-----------------|
| owner | ✅ All team data | ✅ All team data | ✅ Add/remove/promote | ✅ Yes |
| admin | ✅ All team data | ✅ All team data | ✅ Add/remove members | ❌ No |
| member | ✅ All team data | ✅ Team todos/files | ❌ No | ❌ No |

## Operations

### Creating a Team
```typescript
import { createTeam } from './lib/database'
const team = await createTeam({ name: 'My Team' })
// Creator automatically becomes owner via RLS trigger
```

### Getting User's Teams
```typescript
import { getUserTeams } from './lib/database'
const teams = await getUserTeams()
// Returns: [{ id, name, created_by, created_at, updated_at, role }]
```

### Getting Team Members
```typescript
import { getTeamMembers } from './lib/database'
const members = await getTeamMembers(teamId)
// Returns: [{ id, team_id, user_id, role, joined_at, user_email }]
```

### Adding a Member
```typescript
import { addTeamMember } from './lib/database'
await addTeamMember({ teamId, userId, role: 'member' })
```

### Updating Role
```typescript
import { updateMemberRole } from './lib/database'
await updateMemberRole(teamId, userId, 'admin')
```

### Leaving a Team
```typescript
import { leaveTeam } from './lib/database'
await leaveTeam(teamId)
// Removes the current user from the team
```

### Removing a Member (admin/owner)
```typescript
import { removeTeamMember } from './lib/database'
await removeTeamMember(teamId, userId)
```

### Deleting a Team (owner only)
```typescript
import { deleteTeam } from './lib/database'
await deleteTeam(teamId)
// Cascades to team_members and all team-related data
```

## Smart Query Team Hooks

### useUserTeams(userId?)
Fetches all teams the user belongs to.
```typescript
const { data: teams = [], isLoading } = useUserTeams(user?.id)
```

### useTeamMembers(teamId?)
Fetches members of a specific team.
```typescript
const { data: members = [] } = useTeamMembers(selectedTeamId)
```

### useCreateTeam()
Creates a team and invalidates teams cache.
```typescript
const createTeam = useCreateTeam()
await createTeam.mutateAsync({ name: 'New Team' })
```

### useAddTeamMember()
Adds a member and invalidates members cache.
```typescript
const addMember = useAddTeamMember()
await addMember.mutateAsync({ teamId, userId, role: 'member' })
```

### useUpdateMemberRole()
Updates role and invalidates members cache.
```typescript
const updateRole = useUpdateMemberRole()
await updateRole.mutateAsync({ teamId, userId, role: 'admin' })
```

### useRemoveTeamMember()
Removes member and invalidates members cache.
```typescript
const removeMember = useRemoveTeamMember()
await removeMember.mutateAsync({ teamId, userId })
```

### useLeaveTeam()
Leaves team and invalidates teams cache.
```typescript
const leaveTeam = useLeaveTeam()
await leaveTeam.mutateAsync(teamId)
```

## Team-Aware Data Access

### Personal vs Team Context
The template uses a `selectedTeamId` state to switch between personal and team contexts:
```typescript
const isPersonal = !selectedTeamId

// Todos
const todos = isPersonal ? personalTodos : teamTodos

// Files
const files = isPersonal ? personalFiles : teamFiles
```

### RLS Enforcement
All data access is filtered by RLS:
- Personal data: `auth.uid() = user_id AND team_id IS NULL`
- Team data: User must exist in `team_members` for the `team_id`

## Realtime Team Sync
`subscribeToTeam()` creates two channels:
1. Team todos channel - INSERT/UPDATE/DELETE on todos WHERE team_id = X
2. Team members channel - all changes on team_members WHERE team_id = X

## Workspace Sidebar Pattern
The demo App.tsx shows the workspace selector pattern:
```
┌─────────────────────┐
│ 📂 Workspaces       │
│ 👤 Personal     (5) │  ← Personal context
│ ─────────────────   │
│ 👥 Team A           │  ← Team context
│ 👥 Team B           │
│ ─────────────────   │
│ [New team input]    │
│ [Create Team]       │
│ [Leave Team]        │
└─────────────────────┘
```

## Team Todo Integration
When creating a todo with a team_id:
1. The todo is stored in the same `todos` table
2. RLS ensures only team members can see it
3. Realtime broadcasts to all team members' tabs
4. The smart query cache updates instantly
