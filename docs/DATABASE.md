# Database Feature

The database layer provides a powerful abstraction over Supabase's PostgREST API, making it easy to perform CRUD operations, complex queries, and real-time updates.

## Features

- **CRUD Operations**: Simple methods for inserting, updating, and deleting data.
- **Advanced Queries**: Support for filtering, ordering, pagination, and full-text search.
- **Real-time Subscriptions**: Listen to database changes in real-time.
- **Type Safety**: Full TypeScript support for your database schema.
- **Batch Operations**: Efficiently handle multiple records at once.

## Usage

### Fetching Data

```typescript
import { fetchAll } from '@/lib/database';

const todos = await fetchAll('todos', {
  order: { column: 'created_at', ascending: false }
});
```

### Inserting Data

```typescript
import { insertOne } from '@/lib/database';

const newTodo = await insertOne('todos', {
  title: 'New Task',
  completed: false
});
```

### Real-time Updates

```typescript
import { subscribeToTable } from '@/lib/database';

const subscription = subscribeToTable('todos', (payload) => {
  console.log('Change received:', payload);
});

// Later, to unsubscribe:
subscription.unsubscribe();
```

## Hooks

- `useFetch`: Declarative data fetching with loading and error states.
- `useRealtime`: Easily subscribe to table changes within a React component.
- `useLiveQuery`: Combine fetching and real-time updates for a "live" data view.

## Best Practices

- Use **Row Level Security (RLS)** to protect your data.
- Define TypeScript interfaces for your tables to ensure type safety.
- Use batch operations when dealing with more than a few records.
