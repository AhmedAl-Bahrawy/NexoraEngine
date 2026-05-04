# Authentication Guide

## Overview

This template provides a complete authentication system built on Supabase Auth, supporting email/password, OAuth providers, magic links, MFA, and anonymous authentication.

## Files

| File | Purpose |
|------|---------|
| `src/lib/auth/client.ts` | Supabase client initialization with auto-refresh and session persistence |
| `src/lib/auth/operations.ts` | All auth operations: sign in, sign up, OAuth, OTP, password management |
| `src/lib/auth/mfa.ts` | Multi-factor authentication: TOTP enrollment, challenge, verification |
| `src/lib/auth/admin.ts` | Admin operations: create users, list users, generate links (server-side only) |
| `src/hooks/useAuth.tsx` | React context provider and hooks for auth state management |
| `src/providers/SupabaseProvider.tsx` | Alternative provider with connection health monitoring |

## Quick Start

### Email/Password Authentication
```typescript
import { signInWithPassword, signUp, signOut } from './lib/auth'

// Sign up
await signUp({ email: 'user@example.com', password: 'SecureP@ss1' })

// Sign in
const { user, session } = await signInWithPassword({
  email: 'user@example.com',
  password: 'SecureP@ss1',
})

// Sign out
await signOut()
```

### Using Auth Context
```typescript
import { AuthProvider, useAuth } from './hooks/useAuth'

// Wrap your app
<AuthProvider>
  <App />
</AuthProvider>

// Use anywhere
const { user, loading, signIn, signOut, isAuthenticated } = useAuth()
```

## Auth Operations Reference

### Email/Password
| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `signInWithPassword()` | Sign in with email and password | `{ email, password }` | `{ user, session }` |
| `signUp()` | Create a new account | `{ email, password, metadata? }` | `{ user, session }` |
| `signOut()` | End the current session | none | `void` |

### Passwordless (Magic Link)
| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `signInWithOTP()` | Send magic link email | `email: string` | `void` |

### OAuth
| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `signInWithOAuth()` | Redirect to OAuth provider | `provider` ('google' \| 'github' \| 'gitlab' \| 'azure' \| 'bitbucket' \| 'facebook') | `{ url, provider }` |

### Password Management
| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `resetPassword()` | Send password reset email | `email: string` | `void` |
| `updatePassword()` | Change current password | `newPassword: string` | `void` |
| `updateUser()` | Update user attributes | `{ email?, password?, data? }` | `User` |

### Session Management
| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `getSession()` | Get cached session | none | `Session \| null` |
| `getUser()` | Get current user from server | none | `User \| null` |
| `isAuthenticated()` | Check if authenticated | none | `boolean` |
| `refreshSession()` | Force session refresh | none | `Session \| null` |
| `exchangeCodeForSession()` | OAuth callback handler | `code: string` | `{ user, session }` |

### Anonymous Auth
| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `signInAnonymously()` | Create anonymous session | none | `{ user, session }` |
| `linkAnonymousAccount()` | Convert to permanent account | `email, password` | `User` |

## MFA (Multi-Factor Authentication)

### TOTP Flow
```typescript
import { enrollTOTP, challengeMFA, verifyMFA, listMFAFactors, unenrollMFA } from './lib/auth'

// 1. Enroll
const { qrCode, secret } = await enrollTOTP('My App')
// User scans QR code in authenticator app

// 2. Verify
const { user, accessToken } = await verifyMFA(factorId, '123456')

// 3. List factors
const factors = await listMFAFactors()

// 4. Unenroll
await unenrollMFA(factorId)
```

## Protected Routes

```typescript
import { useRequireAuth } from './hooks/useAuth'

function Dashboard() {
  const { isAuthenticated, loading } = useRequireAuth('/login')

  if (loading) return <Loading />
  if (!isAuthenticated) return null // Redirect happens automatically

  return <div>Protected content</div>
}
```

## Auth Context Values

The `useAuth()` hook provides:

| Value | Type | Description |
|-------|------|-------------|
| `user` | `User \| null` | Current authenticated user |
| `session` | `Session \| null` | Current session |
| `loading` | `boolean` | Whether an auth operation is in progress |
| `error` | `AuthError \| null` | Last error |
| `isAuthenticated` | `boolean` | Convenience boolean |
| `signIn()` | `(email, password) => Promise<void>` | Email/password sign in |
| `signUp()` | `(email, password, metadata?) => Promise<void>` | Create account |
| `signOut()` | `() => Promise<void>` | Sign out |
| `signInWithMagicLink()` | `(email) => Promise<void>` | Send magic link |
| `signInWithProvider()` | `(provider) => Promise<void>` | OAuth redirect |
| `resetPassword()` | `(email) => Promise<void>` | Send reset email |
| `updateUser()` | `(attributes) => Promise<void>` | Update user |
| `resendConfirmation()` | `(email) => Promise<void>` | Resend verification |
| `refreshUser()` | `() => Promise<void>` | Refresh user data |
| `clearError()` | `() => void` | Clear error state |

## Error Handling

All auth operations throw errors that are processed through `handleSupabaseError()`:

```typescript
try {
  await signInWithPassword({ email, password })
} catch (err) {
  const { title, message, suggestion } = formatErrorForDisplay(err)
  // Display to user
}
```

Common auth error codes:
- `invalid_credentials` - Wrong email/password
- `email_not_confirmed` - User needs to verify email
- `user_not_found` - No account with this email
- `weak_password` - Password doesn't meet requirements
- `rate_limit_exceeded` - Too many attempts
