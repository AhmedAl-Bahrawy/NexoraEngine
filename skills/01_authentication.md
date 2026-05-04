# 01 — Authentication

**Source files:**
- `src/hooks/useAuth.tsx` — main hook
- `src/lib/auth/operations.ts` — raw Supabase calls
- `src/lib/auth/client.ts` — Supabase client instance
- `src/lib/auth/mfa.ts` — Multi-Factor Auth helpers
- `src/lib/auth/admin.ts` — Admin user management

---

## 🔑 Pattern: Get the current user

```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" />;

  return <p>Hello, {user.email}</p>;
}
```

---

## 🔑 Pattern: Sign Up

```ts
import { signUp } from '@/lib/auth/operations';

const { data, error } = await signUp(email, password);
if (error) console.error(error.message);
```

---

## 🔑 Pattern: Sign In with Email/Password

```ts
import { signIn } from '@/lib/auth/operations';

const { data, error } = await signIn(email, password);
```

---

## 🔑 Pattern: Sign Out

```tsx
const { signOut } = useAuth();
<button onClick={signOut}>Sign Out</button>
```

---

## 🔑 Pattern: OAuth (Google, GitHub, etc.)

```ts
import { supabase } from '@/lib/auth/client';

await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: window.location.origin },
});
```

---

## 🔑 Pattern: Listen to Auth State Changes

```ts
import { supabase } from '@/lib/auth/client';

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') console.log('User signed in', session?.user);
  if (event === 'SIGNED_OUT') console.log('User signed out');
});
```

---

## 🔑 Pattern: Protect a Route

Wrap the route with a check inside the component:
```tsx
const { user, loading } = useAuth();
if (!user && !loading) return <Navigate to="/login" replace />;
```

---

## 🔑 Pattern: MFA (Multi-Factor Auth)

```ts
import { enrollMFA, verifyMFA } from '@/lib/auth/mfa';

// Step 1: Enroll (generates QR code)
const { data } = await enrollMFA();

// Step 2: Verify the code from authenticator app
await verifyMFA(totpCode);
```

---

## ⚠️ Gotchas

- `user` from `useAuth` is `null` on first render — always check `loading` first.
- After sign-up, Supabase sends a **confirmation email** — the session won't exist until the user clicks the link (unless email confirmation is disabled in the Supabase dashboard).
- OAuth redirects: the `redirectTo` URL must be added to **Allowed Redirect URLs** in Supabase Auth settings.
