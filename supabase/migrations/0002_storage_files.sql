-- =====================================================
-- MIGRATION 0002: Storage Files Table + Test Bucket
-- =====================================================

-- 1. STORAGE FILES TABLE (tracks file metadata per user with RLS)
create table storage_files (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  team_id uuid references teams(id) on delete cascade,
  bucket_id text not null default 'test',
  path text not null,
  file_name text not null,
  file_size bigint,
  content_type text,
  public_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- INDEXES
-- =====================================================

create index idx_storage_files_user_id on storage_files(user_id);
create index idx_storage_files_team_id on storage_files(team_id);

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_storage_files_updated_at
  before update on storage_files
  for each row
  execute function update_updated_at_column();

-- =====================================================
-- RLS POLICIES: STORAGE FILES
-- =====================================================

alter table storage_files enable row level security;

-- Users can only see their own files or team files
create policy "Users can view own or team storage files" on storage_files
  for select using (
    auth.uid() = user_id
    or (
      team_id is not null
      and exists (
        select 1 from team_members
        where team_members.team_id = storage_files.team_id
        and team_members.user_id = auth.uid()
      )
    )
  );

create policy "Users can insert own or team storage files" on storage_files
  for insert with check (
    auth.uid() = user_id
    or (
      team_id is not null
      and exists (
        select 1 from team_members
        where team_members.team_id = storage_files.team_id
        and team_members.user_id = auth.uid()
      )
    )
  );

create policy "Users can update own storage files" on storage_files
  for update using (auth.uid() = user_id);

create policy "Users can delete own or team storage files" on storage_files
  for delete using (
    auth.uid() = user_id
    or (
      team_id is not null
      and exists (
        select 1 from team_members
        where team_members.team_id = storage_files.team_id
        and team_members.user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- STORAGE BUCKET
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('test', 'test', true)
ON CONFLICT (id) DO NOTHING;

create policy "Authenticated users can upload to test bucket"
  on storage.objects for insert
  with check (bucket_id = 'test' and auth.role() = 'authenticated');

create policy "Anyone can view files in test bucket"
  on storage.objects for select
  using (bucket_id = 'test');

create policy "Users can delete files from test bucket"
  on storage.objects for delete
  using (bucket_id = 'test');

-- =====================================================
-- REALTIME: Enable replication on storage_files
-- =====================================================

alter publication supabase_realtime add table storage_files;
alter table storage_files replica identity full;
