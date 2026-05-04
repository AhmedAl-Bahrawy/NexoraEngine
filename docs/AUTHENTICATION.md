# Authentication Feature

This project provides a comprehensive authentication system built on top of Supabase Auth. It supports multiple authentication methods and provides a set of easy-to-use hooks and utilities.

## Features

- **Email & Password**: Standard sign-up and sign-in.
- **Magic Links**: Passwordless authentication via email.
- **OAuth**: Support for Google, GitHub, and more.
- **MFA (Multi-Factor Authentication)**: Support for TOTP-based MFA.
- **Session Management**: Automatic token refreshing and session persistence.
- **User Metadata**: Store and retrieve custom user data.

## Usage

### Sign In with Email/Password

```typescript
import { signInWithPassword } from '@/lib/auth';

const { data, error } = await signInWithPassword({
  email: 'user@example.com',
  password: 'securepassword'
});
```

### Sign In with Magic Link

```typescript
import { signInWithOTP } from '@/lib/auth';

const { error } = await signInWithOTP('user@example.com');
```

### Sign Out

```typescript
import { signOut } from '@/lib/auth';

await signOut();
```

## Hooks

- `useAuth`: Access the current user, session, and auth methods.
- `useRequireAuth`: Protect routes by redirecting unauthenticated users.
- `useIsAdmin`: Check if the current user has admin privileges.

## Configuration

Ensure your Supabase project has the desired auth providers enabled in the Supabase Dashboard under **Authentication > Providers**.
