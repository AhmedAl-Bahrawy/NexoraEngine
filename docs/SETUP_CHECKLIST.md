# Supabase Template Setup Checklist

## Pre-Setup
- [ ] Node.js 18+ installed
- [ ] Supabase account created (https://supabase.com)
- [ ] New Supabase project created

## Environment Setup
- [ ] Copy `.env.example` to `.env.local`
- [ ] Get Project URL from Supabase Dashboard (Settings > API)
- [ ] Get Anon Key from Supabase Dashboard (Settings > API)
- [ ] Add credentials to `.env.local`

## Database Setup
- [ ] Open Supabase SQL Editor
- [ ] Run the following SQL:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create todos table for demo
create table todos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users default auth.uid(),
  title text not null,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table todos enable row level security;

-- Create policies
CREATE POLICY "Enable read access for all users" ON todos
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON todos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON todos
  FOR DELETE USING (auth.uid() = user_id);
```

## Storage Setup
- [ ] Go to Supabase Dashboard → Storage
- [ ] Create bucket named `files`
- [ ] Set bucket to public
- [ ] Add RLS policy for uploads:

```sql
CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'files');
```

## Development
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Open http://localhost:5173
- [ ] Test authentication
- [ ] Test database operations (add todos)
- [ ] Test file upload

## Customization
- [ ] Update app name in `App.tsx`
- [ ] Customize colors/styles
- [ ] Add your logo
- [ ] Replace demo features with your own

## Production
- [ ] Build: `npm run build`
- [ ] Test production build: `npm run preview`
- [ ] Deploy to hosting (Vercel, Netlify, etc.)
- [ ] Add production env vars to hosting platform

## Post-Deploy
- [ ] Verify auth works in production
- [ ] Test database operations
- [ ] Test file uploads
- [ ] Monitor Supabase dashboard for usage
- [ ] Set up database backups

## Optional Enhancements
- [ ] Add email templates in Supabase
- [ ] Configure OAuth providers
- [ ] Set up custom domains
- [ ] Add rate limiting
- [ ] Configure MFA for admin accounts

---

✅ **Done! Your Supabase app is ready.**
