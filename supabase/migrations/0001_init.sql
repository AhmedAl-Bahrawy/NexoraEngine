create table todos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users default auth.uid(),
  title text not null,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table todos enable row level security;

-- RLS Policies
create policy "Users can manage their own todos" on todos
  for all using (auth.uid() = user_id);