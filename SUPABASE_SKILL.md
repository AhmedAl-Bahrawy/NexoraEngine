# Supabase Template Skill Guide

This guide explains how to use this template for any future Supabase project. It covers the core patterns for data fetching, authentication, real-time updates, and storage.

## 1. Project Initialization

1. **Clone the Template**: Use this repository as a starting point.
2. **Environment Variables**: Copy `.env.example` to `.env` and fill in your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. **Install Dependencies**: Run `npm install`.
4. **Tailwind Setup**: The project uses Tailwind CSS v4. Styles are managed in `src/index.css`.

## 2. Authentication Pattern

Always use the `useAuth` hook or the `SupabaseProvider` to manage user state.

```typescript
import { useAuth } from '@/hooks/useAuth';

function Profile() {
  const { user, signOut } = useAuth();
  
  if (!user) return <Login />;
  
  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

## 3. Data Fetching & Mutations

Use the modular database utilities in `src/lib/database`.

### Fetching
```typescript
import { fetchAll } from '@/lib/database';

const { data, error } = await fetchAll('your_table_name');
```

### Inserting
```typescript
import { insertOne } from '@/lib/database';

const newItem = await insertOne('your_table_name', { name: 'New Item' });
```

## 4. Real-time Data

For "live" views, use the `useLiveQuery` hook which handles both initial fetching and real-time updates.

```typescript
import { useLiveQuery } from '@/hooks/useSupabase';

function LiveList() {
  const { data, loading } = useLiveQuery('messages');
  
  if (loading) return <Spinner />;
  
  return (
    <ul>
      {data.map(msg => <li key={msg.id}>{msg.text}</li>)}
    </ul>
  );
}
```

## 5. Storage Operations

Manage files using the `src/lib/storage` utilities.

```typescript
import { uploadFile, getPublicUrl } from '@/lib/storage';

async function handleUpload(file: File) {
  const { path } = await uploadFile('my-bucket', `uploads/${file.name}`, file);
  const url = getPublicUrl('my-bucket', path);
  return url;
}
```

## 6. Generalizing the Template

- **Database Schema**: Update `supabase/migrations` with your specific tables.
- **Types**: Generate or manually update types in `src/types/database.ts`.
- **UI Components**: The template uses a general-purpose layout. Customize `src/App.tsx` to fit your specific application needs.

## 7. Best Practices

- **RLS First**: Always enable Row Level Security on new tables.
- **Modular Logic**: Keep your business logic in `src/lib` and UI in `src/components`.
- **Error Handling**: Use the provided `handleSupabaseError` utility for consistent error reporting.
