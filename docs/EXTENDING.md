# Extending the System

This guide covers how to safely extend the template for your specific project needs.

## Adding Your Database Schema

### 1. Create Migrations

Add your SQL migrations to `supabase/migrations/`:

```sql
-- supabase/migrations/0001_create_your_table.sql
CREATE TABLE your_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can read own data"
  ON your_table FOR SELECT
  USING (auth.uid() = user_id);
```

### 2. Generate Types

```bash
supabase gen types typescript --project-id YOUR_PROJECT_REF > src/types/database.ts
```

### 3. Update Type Definitions

Add your generated types alongside the existing generic types:

```typescript
// src/types/database.ts
export interface Database {
  public: {
    Tables: {
      your_table: {
        Row: { id: string; name: string; created_at: string }
        Insert: { id?: string; name: string }
        Update: { name?: string }
      }
    }
  }
}

export type YourTable = Database['public']['Tables']['your_table']['Row']
```

## Adding Custom Operations

### Using Direct Database Functions

```typescript
import { fetchAll, fetchById, insertOne, updateById, deleteById } from '@/lib'
import type { YourTable } from '@/types'

export async function getActiveItems(): Promise<YourTable[]> {
  return fetchAll<YourTable>('your_table', {
    filter: (q) => q.eq('status', 'active'),
    order: { column: 'created_at', ascending: false },
  })
}

export async function createItem(data: YourTable['Insert']): Promise<YourTable> {
  return insertOne<YourTable>('your_table', data)
}
```

### Using the Query Engine

```typescript
import { queryEngine } from '@/lib'
import type { YourTable } from '@/types'

export async function getItemsByStatus(status: string): Promise<YourTable[]> {
  return queryEngine.query<YourTable>({
    table: 'your_table',
    filters: [{ column: 'status', operator: 'eq', value: status }],
    sort: [{ column: 'created_at', ascending: false }],
  })
}
```

### Using the Query Builder

```typescript
import { createQuery } from '@/lib'
import { supabase } from '@/lib'
import type { YourTable } from '@/types'

export async function getComplexItems(criteria: {
  status: string
  minDate: string
  limit: number
}): Promise<YourTable[]> {
  return createQuery<YourTable>(supabase, 'your_table')
    .eq('status', criteria.status)
    .gte('created_at', criteria.minDate)
    .limit(criteria.limit)
    .execute()
}
```

## Adding Custom Validators

```typescript
// src/lib/utils/validators.ts (extend existing file)

export function validateCustomField(value: string): { isValid: boolean; error?: string } {
  if (!value) return { isValid: false, error: 'Field is required' }
  if (value.length < 3) return { isValid: false, error: 'Minimum 3 characters' }
  return { isValid: true }
}
```

## Adding Custom Error Types

```typescript
// src/lib/utils/errors.ts (extend existing file)

export class CustomError extends SupabaseError {
  constructor(message: string, options?: { details?: string; hint?: string }) {
    super(message, 'custom_error', options)
    this.name = 'CustomError'
  }
}

export function isCustomErrorType(error: unknown): error is CustomError {
  return error instanceof CustomError
}
```

## Adding Realtime Subscriptions

```typescript
import { subscribeToTable, unsubscribe, type RealtimeChange } from '@/lib'
import type { YourTable } from '@/types'

export function watchYourTable(
  callbacks: {
    onInsert?: (item: YourTable) => void
    onUpdate?: (item: YourTable) => void
    onDelete?: (item: YourTable) => void
  }
) {
  const channel = subscribeToTable<YourTable>(
    { table: 'your_table', event: '*' },
    callbacks
  )

  return {
    unsubscribe: () => unsubscribe(channel),
  }
}
```

## Adding Custom Cache Strategies

```typescript
import { QueryEngine, QueryCache } from '@/lib'

// Create a cache with different defaults
const aggressiveCache = new QueryCache({
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  maxEntries: 1000,
})

// Create an engine with the custom cache
const cachedEngine = new QueryEngine(aggressiveCache)

// Or create a no-cache engine for real-time data
const realTimeEngine = new QueryEngine(new QueryCache({ defaultTTL: 0 }))
```

## Environment Configuration

Add your custom environment variables:

```typescript
// src/lib/constants/supabase.ts (extend existing file)

export const CUSTOM_ENV_KEYS = {
  API_KEY: 'VITE_API_KEY',
  CUSTOM_URL: 'VITE_CUSTOM_URL',
} as const
```

## Project Structure Recommendations

```
src/
├── lib/                    # Template core (do not modify)
│   ├── auth/
│   ├── database/
│   ├── storage/
│   ├── cache/
│   ├── query-engine/
│   ├── utils/
│   ├── constants/
│   └── index.ts
├── types/                  # Your generated types
│   └── database.ts
├── services/               # Your domain services
│   ├── userService.ts
│   └── productService.ts
├── repositories/           # Your data access layer (optional)
│   └── userRepository.ts
└── index.ts                # Your application entry
```

## Best Practices

1. **Never modify `src/lib/`** - Treat it as a dependency
2. **Put domain logic in `src/services/`** - Keep it separate from the template
3. **Use TypeScript generics** - Maintain type safety throughout
4. **Extend, don't replace** - Add new files rather than modifying existing ones
5. **Test your extensions** - Write tests for custom operations
6. **Use the query engine** - Prefer `queryEngine` over direct operations for caching
7. **Validate inputs early** - Use validators before database calls
8. **Handle errors consistently** - Use the error handling system
