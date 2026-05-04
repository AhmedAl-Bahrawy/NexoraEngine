# Setup Checklist

## Prerequisites
- [ ] Node.js 18+ installed
- [ ] npm/pnpm/yarn installed
- [ ] Supabase CLI installed (`npm i -g supabase`)
- [ ] Supabase project created at https://supabase.com

## Initial Setup

### 1. Clone & Install
```bash
git clone <repo-url>
cd SupabaseFullLearn
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

Get your credentials from: Supabase Dashboard → Project Settings → API
- `VITE_SUPABASE_URL` → Project URL
- `VITE_SUPABASE_ANON_KEY` → anon/public key

### 3. Apply Migrations
```bash
# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push

# Verify
supabase migration list
```

### 4. Start Development
```bash
npm run dev
```

## Project Configuration

### Auth Providers
Enable in Supabase Dashboard → Authentication → Providers:
- [ ] Email/Password (enabled by default)
- [ ] Google (requires OAuth credentials)
- [ ] GitHub (requires OAuth credentials)
- [ ] Any other providers you need

### Storage Buckets
Create in Supabase Dashboard → Storage:
- [ ] `test` bucket (created by migration 0002)
- [ ] Any additional buckets your project needs

Set bucket policies:
- [ ] Public buckets: Allow public read
- [ ] Private buckets: RLS only

### Realtime
Verify realtime is enabled on tables:
```sql
-- Check publication
SELECT * FROM pg_publication_tables;
```

Tables in the publication:
- [ ] todos (migration 0001)
- [ ] storage_files (migration 0002)
- [ ] teams (migration 0003)
- [ ] team_members (migration 0003)

## Verification

### Test Authentication
1. [ ] Sign up with email/password
2. [ ] Verify email confirmation (if enabled)
3. [ ] Sign in with credentials
4. [ ] Sign out

### Test Database
1. [ ] Create a personal todo
2. [ ] Verify it appears in the list
3. [ ] Toggle completed
4. [ ] Delete the todo

### Test Teams
1. [ ] Create a team
2. [ ] Verify team appears in sidebar
3. [ ] Create a team todo
4. [ ] Switch to personal workspace
5. [ ] Verify team todo is not visible

### Test Storage
1. [ ] Upload a file
2. [ ] Verify it appears in file list
3. [ ] Download the file
4. [ ] Delete the file

### Test Realtime
1. [ ] Open app in 2 browser tabs
2. [ ] Sign in with same account
3. [ ] Create a todo in tab 1
4. [ ] Verify it appears instantly in tab 2
5. [ ] Toggle/delete in tab 1
6. [ ] Verify change in tab 2

## Production Deployment

### Build
```bash
npm run build
```

### Environment Variables for Production
Set in your hosting platform:
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`

### Security Checklist
- [ ] RLS enabled on all tables
- [ ] Service role key NOT exposed in client
- [ ] CORS configured for your domain
- [ ] Email confirmation enabled (if needed)
- [ ] Rate limiting configured (if needed)
- [ ] Storage bucket policies set correctly
