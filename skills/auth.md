# Auth System Reference

## Client Management

### `createSupabaseClient(config: SupabaseConfig): SupabaseClient`
Creates and initializes the Supabase client singleton.

### `initializeSupabase(config?: SupabaseConfig): SupabaseClient`
Auto-initializes from environment if no config provided.

### `getSupabaseClient(): SupabaseClient`
Retrieves the client instance (auto-initializes if needed).

### `isSupabaseInitialized(): boolean`
Checks if client exists.

## Authentication Operations

### `signInWithPassword(credentials: SignInCredentials): Promise<AuthResult>`
Email/password login.

### `signUp(credentials: SignUpCredentials): Promise<AuthResult>`
Email/password registration with optional metadata.

### `signOut(): Promise<void>`
Ends current session.

### `signInWithOTP(email: string): Promise<void>`
Sends magic link/OTP to email.

### `signInWithOAuth(options: OAuthOptions): Promise<{ url: string; provider: string }>`
OAuth flow initiation.

### `verifyOTP(params: { email: string; token: string; type?: 'email' | 'recovery' | 'invite' | 'magiclink' }): Promise<AuthResult>`
Verifies OTP token.

### `resetPassword(email: string, redirectTo?: string): Promise<void>`
Sends password reset email.

### `updatePassword(newPassword: string): Promise<void>`
Updates current user password.

### `updateUser(attributes: { email?: string; password?: string; data?: Record<string, unknown> }): Promise<User>`
Updates user profile.

### `getSession(): Promise<Session | null>`
Gets current session.

### `getUser(): Promise<User | null>`
Gets current user.

### `isAuthenticated(): Promise<boolean>`
Checks authentication status.

### `refreshSession(): Promise<Session | null>`
Refreshes current session.

### `onAuthStateChange(callback: (event: string, session: Session | null) => void): Promise<{ unsubscribe: () => void }>`
Subscribes to auth state changes.

## MFA Operations

### `enrollTOTP(friendlyName?: string): Promise<MFAEnrollResult>`
Enrolls TOTP factor.

### `challengeMFA(factorId: string): Promise<{ id: string; expires_at: number }>`
Creates MFA challenge.

### `verifyMFA(factorId: string, code: string, challengeId?: string): Promise<MFAVerifyResult>`
Verifies MFA code.

### `unenrollMFA(factorId: string): Promise<void>`
Removes MFA factor.

### `listMFAFactors(): Promise<{ all: Factor[]; totp: Factor[]; phone: Factor[] }>`
Lists enrolled factors.

## Admin Operations

### `createUser(params: CreateUserParams): Promise<User>`
Creates user (requires service role).

### `deleteUser(userId: string): Promise<void>`
Deletes user.

### `getUserById(userId: string): Promise<User>`
Gets user by ID.

### `listUsers(options?: { page?: number; perPage?: number }): Promise<ListUsersResult>`
Lists all users.

### `updateUserById(userId: string, attributes: AdminUpdateParams): Promise<User>`
Updates user by ID.

### `inviteUserByEmail(email: string, options?: InviteOptions): Promise<User>`
Invites user via email.

## Auth Middleware

### `enforceAuth(options?: AuthMiddlewareOptions): Promise<AuthContext>`
Validates authentication and authorization.

### `requireAuth(): Promise<AuthContext>`
Requires any authenticated user.

### `requireRole(role: string): Promise<AuthContext>`
Requires specific role.

### `requireAnyRole(roles: string[]): Promise<AuthContext>`
Requires one of multiple roles.

### `requireVerifiedEmail(): Promise<AuthContext>`
Requires verified email.

### `withAuth<T>(handler: (ctx: AuthContext) => Promise<T>, options?: AuthMiddlewareOptions): Promise<T>`
Wraps handler with auth context.

## Types

```typescript
interface SignInCredentials { email: string; password: string }
interface SignUpCredentials extends SignInCredentials { metadata?: Record<string, unknown> }
interface AuthResult { user: User | null; session: Session | null }
interface OAuthOptions { provider: string; redirectTo?: string; scopes?: string }
interface AuthContext { user: User; session: Session; userId: string; email?: string; role?: string }
interface AuthMiddlewareOptions { requireEmail?: boolean; requireRole?: string; allowedRoles?: string[]; customCheck?: (user: User) => boolean }
```
