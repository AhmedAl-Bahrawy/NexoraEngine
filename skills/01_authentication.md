# Skill 01: Authentication

## Template Core Files
- `src/lib/auth/client.ts` - Supabase client initialization
- `src/lib/auth/operations.ts` - All auth operations
- `src/lib/auth/mfa.ts` - Multi-factor authentication
- `src/lib/auth/admin.ts` - Admin operations (server-side only)
- `src/lib/auth/index.ts` - Barrel exports
- `src/hooks/useAuth.tsx` - Auth context and hooks
- `src/providers/SupabaseProvider.tsx` - Auth state provider

## Client Setup (`client.ts`)
The Supabase client is configured once and shared across all modules:
```typescript
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,    // Auto-refreshes tokens before expiry
    persistSession: true,       // Persists to localStorage
    detectSessionInUrl: true,   // Detects OAuth callback sessions
  },
})
```

## Authentication Flow
1. **Sign Up**: `signUp({ email, password, metadata? })` → validates email + password strength → creates account
2. **Sign In**: `signInWithPassword({ email, password })` → validates credentials → returns user + session
3. **Magic Link**: `signInWithOTP(email)` → sends email → user clicks link → auto signs in
4. **OAuth**: `signInWithOAuth(provider)` → redirects to provider → callback exchanges code for session
5. **Sign Out**: `signOut()` → clears session → triggers SIGNED_OUT event

## Session Management
- `getSession()` - Gets cached session from storage
- `getUser()` - Fetches fresh user from server
- `isAuthenticated()` - Boolean check
- `refreshSession()` - Force refresh tokens
- `exchangeCodeForSession(code)` - OAuth callback handler

## MFA Flow
1. `enrollTOTP()` → returns QR code + secret for authenticator app
2. User scans QR in authenticator app
3. `challengeMFA(factorId)` → starts verification challenge
4. `verifyMFA(factorId, code)` → verifies TOTP code
5. `listMFAFactors()` → shows enrolled factors
6. `unenrollMFA(factorId)` → removes factor

## Auth Context (`useAuth.tsx`)
The `AuthProvider` component wraps your app and provides:
- `user`, `session` - Current auth state
- `loading`, `error` - Operation state
- `isAuthenticated` - Boolean convenience
- `signIn()`, `signUp()`, `signOut()` - Core operations
- `signInWithMagicLink()`, `signInWithProvider()` - Alternative auth
- `resetPassword()`, `updateUser()`, `resendConfirmation()` - Account management
- `refreshUser()`, `clearError()` - Utilities

## Protected Routes
```typescript
const { isAuthenticated, loading } = useRequireAuth('/login')
```

## Admin Operations (Server-Side Only)
⚠️ These require the service role key and should NEVER run in the browser:
- `createUser()` - Create users programmatically
- `deleteUser()` - Remove users
- `listUsers()` - Paginated user list
- `updateUserById()` - Modify user attributes
- `inviteUserByEmail()` - Send invite emails
- `generateLink()` - Generate auth links (signup, invite, magiclink, recovery, email_change)
