# Supabase Full-Stack Template

A complete, production-ready template for building applications with Supabase, React, and TypeScript.

## 🚀 Quick Start

```bash
# 1. Clone and install
npm install

# 2. Create environment file
cp .env.example .env.local

# 3. Add your Supabase credentials to .env.local:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 4. Run development server
npm run dev
```

## 📁 Project Structure

```
src/
├── lib/                    # Core Supabase functionality
│   ├── auth/              # Authentication
│   │   ├── client.ts      # Supabase client setup
│   │   ├── operations.ts    # Sign in/up/out, OAuth
│   │   ├── mfa.ts         # Multi-factor auth
│   │   ├── admin.ts       # Admin operations
│   │   └── index.ts       # Barrel exports
│   ├── database/          # Database operations
│   │   ├── queries.ts     # Fetch, search, pagination
│   │   ├── mutations.ts   # Insert, update, delete
│   │   ├── realtime.ts    # Subscriptions
│   │   └── index.ts       # Barrel exports
│   ├── storage/           # File storage
│   │   └── index.ts       # Upload, download, URLs
│   ├── utils/             # Utilities
│   │   ├── errors.ts      # Error handling
│   │   ├── validators.ts  # Input validation
│   │   ├── formatters.ts  # Data formatting
│   │   └── index.ts       # Barrel exports
│   ├── constants/         # Configuration
│   │   └── supabase.ts    # Constants
│   ├── index.ts           # Main exports
│   └── supabase.ts        # Legacy compatibility
│
├── hooks/                 # React hooks (optional)
│   ├── useAuth.tsx        # Auth state
│   └── useSupabase.ts     # Database hooks
│
├── providers/             # React providers
│   └── SupabaseProvider.tsx
│
├── types/                 # TypeScript types
│   └── database.ts        # Database schema types
│
├── App.tsx               # Main app with demo
└── main.tsx              # Entry point
```

## ✨ Features

### Authentication
- ✅ Email/password authentication
- ✅ OAuth (Google, GitHub, GitLab, Azure)
- ✅ Magic Link (passwordless)
- ✅ Multi-factor authentication (TOTP)
- ✅ Anonymous sign-in
- ✅ Admin operations (server-side)

### Database
- ✅ CRUD operations
- ✅ Pagination
- ✅ Search (ILIKE, full-text)
- ✅ Realtime subscriptions
- ✅ Soft delete / restore
- ✅ Bulk operations
- ✅ Aggregates (count, sum, avg)

### Storage
- ✅ File upload/download
- ✅ Image/document validation
- ✅ Public & signed URLs
- ✅ File listing
- ✅ Move/copy operations

### Utilities
- ✅ Error handling with custom classes
- ✅ Input validation (email, password, files)
- ✅ Data formatters (dates, numbers, strings)
- ✅ Type-safe operations

## 📝 Usage Examples

### Authentication

```typescript
import { signInWithPassword, signUp, signOut, signInWithOAuth } from '@/lib/auth'

// Sign in
const { user, session } = await signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// Sign up
await signUp({ email, password, metadata: { name: 'John' } })

// OAuth
await signInWithOAuth('google')

// Sign out
await signOut()
```

### Database Operations

```typescript
import { fetchAll, insertOne, updateById, deleteById } from '@/lib/database'

// Fetch all
const todos = await fetchAll<Todo>('todos', {
  order: { column: 'created_at', ascending: false },
  limit: 10
})

// Insert
const newTodo = await insertOne<Todo>('todos', {
  title: 'New task',
  completed: false
})

// Update
await updateById('todos', id, { completed: true })

// Delete
await deleteById('todos', id)
```

### Realtime Subscriptions

```typescript
import { subscribeToTable } from '@/lib/database'

const channel = subscribeToTable(
  { table: 'todos', event: '*' },
  {
    onInsert: (todo) => console.log('New:', todo),
    onUpdate: (todo) => console.log('Updated:', todo),
    onDelete: (todo) => console.log('Deleted:', todo),
  }
)

// Cleanup
channel.unsubscribe()
```

### File Storage

```typescript
import { uploadFile, getPublicUrl, deleteFile } from '@/lib/storage'

// Upload
const { path } = await uploadFile('avatars', 'user-123.jpg', file)

// Get URL
const url = getPublicUrl('avatars', path)

// Delete
await deleteFile('avatars', path)
```

### Error Handling

```typescript
import { handleSupabaseError, formatErrorForDisplay } from '@/lib/utils'

try {
  await someOperation()
} catch (err) {
  // Get formatted error for display
  const { title, message, suggestion, code } = formatErrorForDisplay(err)
  
  // Or handle programmatically
  const error = handleSupabaseError(err)
  if (error.code === 'invalid_credentials') {
    // Handle specific error
  }
}
```

## 🗄️ Database Setup

### Required Tables

```sql
-- Todos table (for demo)
create table todos (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table todos enable row level security;

-- RLS Policies
create policy "Users can view own todos" on todos
  for select using (auth.uid() = user_id);

create policy "Users can create own todos" on todos
  for insert with check (auth.uid() = user_id);

create policy "Users can update own todos" on todos
  for update using (auth.uid() = user_id);

create policy "Users can delete own todos" on todos
  for delete using (auth.uid() = user_id);
```

### Storage Buckets

1. Go to Supabase Dashboard → Storage
2. Create buckets: `avatars`, `files`, `images`
3. Set appropriate RLS policies

## 🔐 Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 🧪 Development

```bash
# Run dev server
npm run dev

# Type check
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 Building for Production

```bash
npm run build
```

Output goes to `dist/` folder. Deploy to:
- Vercel
- Netlify
- GitHub Pages
- Any static host

## 🎯 App Structure (Demo)

The included `App.tsx` demonstrates:

1. **Navigation** - Switch between views
2. **Home** - Feature overview
3. **Auth** - Sign in/up demo
4. **Database** - Todo list CRUD
5. **Storage** - File upload demo

## 📚 Next Steps

1. **Customize UI** - Replace Tailwind classes with your design system
2. **Add Routes** - Use React Router for page navigation
3. **Add Tables** - Create your database schema
4. **Add Features** - Extend with your business logic
5. **Deploy** - Push to production

## 🔗 Useful Links

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 💡 Tips

1. **Use granular imports** for tree-shaking:
   ```typescript
   import { fetchAll } from '@/lib/database/queries'
   ```

2. **Always handle errors** using the error utilities

3. **Use TypeScript** for type-safe database operations

4. **Enable RLS** on all tables for security

5. **Use realtime** for live updates instead of polling

---

**Ready to build!** 🚀
