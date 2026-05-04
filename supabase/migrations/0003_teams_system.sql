-- =====================================================
-- MIGRATION 0003: Teams System + Team-Based Todos + Realtime
-- =====================================================

-- 1. TEAMS TABLE
create table teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TEAM MEMBERS TABLE
create table team_members (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (team_id, user_id)
);

-- 3. UPDATE TODOS: add team_id for team-based todos
alter table todos add column if not exists team_id uuid references teams(id) on delete cascade;

-- =====================================================
-- INDEXES
-- =====================================================

create index idx_team_members_team_id on team_members(team_id);
create index idx_team_members_user_id on team_members(user_id);
create index idx_todos_team_id on todos(team_id);

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_teams_updated_at
  before update on teams
  for each row
  execute function update_updated_at_column();

-- =====================================================
-- RLS POLICIES: TEAMS
-- =====================================================

alter table teams enable row level security;

-- Team creators can see their teams
create policy "Users can view teams they belong to" on teams
  for select using (
    auth.uid() = created_by
    or exists (
      select 1 from team_members
      where team_members.team_id = teams.id
      and team_members.user_id = auth.uid()
    )
  );

create policy "Users can create teams" on teams
  for insert with check (auth.uid() = created_by);

create policy "Team owners can update their teams" on teams
  for update using (auth.uid() = created_by);

create policy "Team owners can delete their teams" on teams
  for delete using (auth.uid() = created_by);

-- =====================================================
-- RLS POLICIES: TEAM MEMBERS
-- =====================================================

alter table team_members enable row level security;

create policy "Members can view team members of their teams" on team_members
  for select using (
    exists (
      select 1 from team_members tm
      where tm.team_id = team_members.team_id
      and tm.user_id = auth.uid()
    )
  );

create policy "Owners and admins can add members" on team_members
  for insert with check (
    exists (
      select 1 from team_members tm
      where tm.team_id = team_members.team_id
      and tm.user_id = auth.uid()
      and tm.role in ('owner', 'admin')
    )
  );

create policy "Owners and admins can update member roles" on team_members
  for update using (
    exists (
      select 1 from team_members tm
      where tm.team_id = team_members.team_id
      and tm.user_id = auth.uid()
      and tm.role in ('owner', 'admin')
    )
  );

create policy "Owners and admins can remove members" on team_members
  for delete using (
    exists (
      select 1 from team_members tm
      where tm.team_id = team_members.team_id
      and tm.user_id = auth.uid()
      and tm.role in ('owner', 'admin')
    )
  );

-- =====================================================
-- RLS POLICIES: TODOS (updated for team support)
-- =====================================================

-- Allow viewing personal todos OR team todos
create policy "Users can view personal or team todos" on todos
  for select using (
    auth.uid() = user_id
    or (
      team_id is not null
      and exists (
        select 1 from team_members
        where team_members.team_id = todos.team_id
        and team_members.user_id = auth.uid()
      )
    )
  );

create policy "Users can create personal todos" on todos
  for insert with check (auth.uid() = user_id and team_id is null);

create policy "Team members can create team todos" on todos
  for insert with check (
    team_id is not null
    and exists (
      select 1 from team_members
      where team_members.team_id = todos.team_id
      and team_members.user_id = auth.uid()
    )
  );

create policy "Users can update their own todos" on todos
  for update using (auth.uid() = user_id);

create policy "Team members can update team todos" on todos
  for update using (
    team_id is not null
    and exists (
      select 1 from team_members
      where team_members.team_id = todos.team_id
      and team_members.user_id = auth.uid()
    )
  );

create policy "Users can delete their own todos" on todos
  for delete using (auth.uid() = user_id);

create policy "Team members can delete team todos" on todos
  for delete using (
    team_id is not null
    and exists (
      select 1 from team_members
      where team_members.team_id = todos.team_id
      and team_members.user_id = auth.uid()
    )
  );

-- =====================================================
-- REALTIME: Enable replication on teams tables
-- =====================================================

alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table team_members;

alter table todos replica identity full;
alter table teams replica identity full;
alter table team_members replica identity full;
