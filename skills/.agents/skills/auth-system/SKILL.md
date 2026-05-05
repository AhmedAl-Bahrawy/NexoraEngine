---
name: auth-system
description: Generic authentication utilities with session handling abstraction, extensible permission system, and MFA support. Provides complete auth layer on top of Supabase Auth.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  sdk_layer: auth
  complexity: medium
  stability: stable
---

# Auth System

## Overview

Generic authentication utilities with session handling abstraction, extensible permission system, and no role assumptions.

## What It Does

Provides a complete authentication layer on top of Supabase Auth, including sign-up/sign-in, OAuth, MFA, admin operations, and middleware for protecting routes.

## Why Use It

Abstracts Supabase Auth into a clean, reusable API with proper error handling, session management, and extensible middleware for any application type.

## Inputs

```typescript
// signInWithPassword()
{ email: string; password: string }

// signUp()
{ email: string; password: string; metadata?: Record<string, unknown> }

// enforceAuth()
{ requireRole?: string; requireAny?: string[]; requireVerified?: boolean }
```

## Outputs

```typescript
// AuthResult
{ user: User | null; session: Session | null }

// enforceAuth()
AuthContext: { user, userId, email, role, session }

// getUser()
User | null
```

## Usage

### Steps

1. Import auth functions from `nexora-engine`
2. Initialize client with Supabase credentials
3. Call auth functions as needed

### Code Examples

```typescript
import { signInWithPassword, signUp, signOut, getUser, enforceAuth } from 'nexora-engine'

// Sign in
const { user, session } = await signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
})

// Sign up
const { user, session } = await signUp({
  email: 'new@example.com',
  password: 'password123',
  metadata: { name: 'John' },
})

// Get current user
const user = await getUser()

// Sign out
await signOut()

// Auth middleware
const ctx = await enforceAuth({ requireRole: 'admin' })
// ctx.user, ctx.userId, ctx.email, ctx.role available

// OAuth
import { signInWithOAuth } from 'nexora-engine'
const { url } = await signInWithOAuth({ provider: 'google' })

// MFA
import { enrollTOTP, challengeMFA, verifyMFA } from 'nexora-engine'
const { secret, qrCode } = await enrollTOTP()
const { challenge } = await challengeMFA(factorId)
await verifyMFA(challengeId, factorId, code)
```

## Internal Logic

### Flow

1. Get Supabase client from core layer
2. Call Supabase Auth methods
3. Handle errors and transform to `AuthError`
4. Return normalized result

### Execution Reasoning

- All auth functions go through `executeRequest()` or direct Supabase calls
- `enforceAuth()` checks session, then applies role/verification rules
- MFA operations manage TOTP lifecycle
- Admin operations use service role client when available

## Constraints

### Rules

- Email must be valid format
- Password must meet requirements (min 8 chars by default)
- OAuth provider must be supported
- `enforceAuth()` throws `AuthError` (401/403) on failure

### Anti-Patterns

- Don't store passwords in plain text
- Don't skip email verification for sensitive apps
- Don't use admin operations without service role key

## Dependencies

### Internal SDK Modules

- `getClient` (from `./core/client`)
- `AuthError` (from `./errors/nexora-error`)
- `executeRequest` (from `./core/pipeline`)

### External Libraries

- `@supabase/supabase-js`

## Code Mapping

```typescript
// SDK Functions
signInWithPassword() -> signInWithPassword()
signUp()             -> signUp()
signOut()            -> signOut()
getUser()            -> getUser()
enforceAuth()        -> enforceAuth()
signInWithOAuth()    -> signInWithOAuth()
enrollTOTP()         -> enrollTOTP()
challengeMFA()       -> challengeMFA()
verifyMFA()          -> verifyMFA()
```

## When to Use

- Use for user authentication flows
- Use `enforceAuth()` to protect API routes/server actions
- Use MFA functions for enhanced security
- Use admin functions for user management

## When NOT to Use

- Don't use for database operations (use query layer)
- Don't use for file storage (use storage module)
- Don't bypass `enforceAuth()` for protected routes

## Reasoning Strategy

1. Determine auth flow needed (password, OAuth, magic link)
2. Use `enforceAuth()` for route protection
3. Check `getUser()` for session state
4. Use MFA for sensitive operations
5. Handle `AuthError` with appropriate HTTP status codes
