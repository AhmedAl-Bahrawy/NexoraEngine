# 06 — Edge Functions

Supabase Edge Functions run server-side TypeScript (Deno) at the edge.
Use them for: webhooks, sending emails, payment processing, or any logic you can't expose client-side.

**Location in project:** `supabase/functions/`

---

## ⚡ Pattern: Create a New Edge Function

```bash
# From the project root:
supabase functions new my-function
```

This creates: `supabase/functions/my-function/index.ts`

---

## ⚡ Pattern: Basic Edge Function Structure

```ts
// supabase/functions/my-function/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // 1. Parse the request
  const { name } = await req.json();

  // 2. Create a Supabase client (server-side, with service role)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // 3. Do your work
  const { data } = await supabase.from('users').select('*').eq('name', name);

  // 4. Return a response
  return new Response(JSON.stringify({ result: data }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

---

## ⚡ Pattern: Call an Edge Function from React

```ts
import { supabase } from '@/lib/database/client';

const { data, error } = await supabase.functions.invoke('my-function', {
  body: { name: 'Ahmed' },
});
```

---

## ⚡ Pattern: Deploy a Function

```bash
# Deploy all functions:
supabase functions deploy

# Deploy a specific function:
supabase functions deploy my-function
```

---

## ⚡ Pattern: Set Environment Variables for Functions

```bash
supabase secrets set MY_SECRET=my-secret-value
```

Access in the function: `Deno.env.get('MY_SECRET')`

---

## ⚡ Pattern: Auth Guard in Edge Function

```ts
serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  // ... rest of logic
});
```

---

## ⚠️ Gotchas

- Edge Functions use **Deno**, not Node.js — `import` syntax is different (use URLs).
- Use `SUPABASE_SERVICE_ROLE_KEY` only server-side (never in client code).
- CORS must be handled manually if calling from a browser.
- Local testing: `supabase functions serve my-function`.
