import { useState, useEffect, useCallback, useContext, createContext } from 'react'
import {
  supabase,
  signInWithPassword,
  signUp as supabaseSignUp,
  signInWithOtp,
  signInWithOAuth,
  resetPassword as supabaseResetPassword,
  updateUser as supabaseUpdateUser,
  resendConfirmationEmail as supabaseResendConfirmation,
  signOut as supabaseSignOut,
  getCurrentUser,
  getCurrentSession,
  exchangeCodeForSession,
  getSessionFromUrl,
  refreshSession,
  type User,
  type Session,
} from '../lib/supabase'
import type { AuthError } from '@supabase/supabase-js'

// Auth context types
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: AuthError | null
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, metadata?: object) => Promise<void>
  signInWithMagicLink: (email: string) => Promise<void>
  signInWithProvider: (provider: 'google' | 'github' | 'gitlab' | 'azure') => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUser: (attributes: { email?: string; password?: string; data?: Record<string, unknown> }) => Promise<void>
  resendConfirmation: (email: string) => Promise<void>
  refreshUser: () => Promise<void>
  clearError: () => void
}

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth Provider Component
interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setIsAuthenticated(!!currentUser)
    } catch (err) {
      setUser(null)
      setIsAuthenticated(false)
    }
  }, [])

  // Initial session check
  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentSession = await getCurrentSession()
        setSession(currentSession)
        
        if (currentSession?.user) {
          setUser(currentSession.user)
          setIsAuthenticated(true)
        }
      } catch (err) {
        console.error('Session check error:', err)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        setIsAuthenticated(!!currentSession?.user)

        // Handle specific auth events
        switch (event) {
          case 'SIGNED_IN':
            console.log('User signed in')
            break
          case 'SIGNED_OUT':
            console.log('User signed out')
            break
          case 'USER_UPDATED':
            console.log('User updated')
            break
          case 'PASSWORD_RECOVERY':
            console.log('Password recovery initiated')
            break
          case 'TOKEN_REFRESHED':
            console.log('Token refreshed')
            break
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Sign in with email/password
  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    try {
      const { user: authUser, session: authSession } = await signInWithPassword(email, password)
      setUser(authUser)
      setSession(authSession)
      setIsAuthenticated(true)
    } catch (err) {
      setError(err as AuthError)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Sign up
  const signUp = useCallback(async (email: string, password: string, metadata?: object) => {
    setLoading(true)
    setError(null)

    try {
      const { user: authUser, session: authSession } = await supabaseSignUp(email, password, metadata)
      setUser(authUser)
      setSession(authSession)
      if (authSession) {
        setIsAuthenticated(true)
      }
    } catch (err) {
      setError(err as AuthError)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Sign in with magic link (OTP)
  const signInWithMagicLink = useCallback(async (email: string) => {
    setLoading(true)
    setError(null)

    try {
      await signInWithOtp(email)
    } catch (err) {
      setError(err as AuthError)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Sign in with OAuth provider
  const signInWithProvider = useCallback(async (provider: 'google' | 'github' | 'gitlab' | 'azure') => {
    setLoading(true)
    setError(null)

    try {
      await signInWithOAuth(provider)
    } catch (err) {
      setError(err as AuthError)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Sign out
  const handleSignOut = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      await supabaseSignOut()
      setUser(null)
      setSession(null)
      setIsAuthenticated(false)
    } catch (err) {
      setError(err as AuthError)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Reset password
  const handleResetPassword = useCallback(async (email: string) => {
    setLoading(true)
    setError(null)

    try {
      await supabaseResetPassword(email)
    } catch (err) {
      setError(err as AuthError)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Update user
  const handleUpdateUser = useCallback(async (attributes: { email?: string; password?: string; data?: Record<string, unknown> }) => {
    setLoading(true)
    setError(null)

    try {
      const updatedUser = await supabaseUpdateUser(attributes)
      setUser(updatedUser)
    } catch (err) {
      setError(err as AuthError)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Resend confirmation email
  const handleResendConfirmation = useCallback(async (email: string) => {
    setLoading(true)
    setError(null)

    try {
      await supabaseResendConfirmation(email)
    } catch (err) {
      setError(err as AuthError)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    isAuthenticated,
    signIn,
    signUp,
    signInWithMagicLink,
    signInWithProvider,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    updateUser: handleUpdateUser,
    resendConfirmation: handleResendConfirmation,
    refreshUser,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for protected routes
export function useRequireAuth(redirectTo: string = '/login') {
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // In a real app, you'd use your router's navigation
      // This is a placeholder - replace with your router's navigation method
      window.location.href = redirectTo
    }
  }, [isAuthenticated, loading, redirectTo])

  return { isAuthenticated, loading }
}

// Hook for checking if user is admin (requires custom claim in user metadata)
export function useIsAdmin(): boolean {
  const { user } = useAuth()
  return user?.app_metadata?.role === 'admin' || user?.user_metadata?.role === 'admin'
}

// Hook for user metadata
export function useUserMetadata<T extends Record<string, unknown> = Record<string, unknown>>() {
  const { user } = useAuth()
  return user?.user_metadata as T | undefined
}

// Hook for OAuth callback handling
export function useOAuthCallback() {
  const { refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const handleCallback = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Check for auth code in URL
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')

      if (code) {
        await exchangeCodeForSession(code)
        await refreshUser()
        
        // Clean up URL
        window.history.replaceState({}, document.title, url.pathname)
        return true
      }

      // Check for session from URL hash (implicit flow)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      
      if (accessToken) {
        await getSessionFromUrl()
        await refreshUser()
        
        // Clean up URL
        window.history.replaceState({}, document.title, url.pathname)
        return true
      }

      return false
    } catch (err) {
      const error = err instanceof Error ? err : new Error('OAuth callback failed')
      setError(error)
      return false
    } finally {
      setLoading(false)
    }
  }, [refreshUser])

  return { handleCallback, loading, error }
}

// Hook for password reset flow
export function usePasswordReset() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [success, setSuccess] = useState(false)

  const sendResetLink = useCallback(async (email: string) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await supabaseResetPassword(email)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to send reset link'))
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update password'))
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { sendResetLink, updatePassword, loading, error, success }
}

// Hook for session management
export function useSession() {
  const { session, user } = useAuth()
  const [isExpiring, setIsExpiring] = useState(false)

  useEffect(() => {
    if (!session) return

    // Check if session is expiring soon (within 5 minutes)
    const expiresAt = session.expires_at
    if (!expiresAt) return

    const checkExpiration = () => {
      const now = Math.floor(Date.now() / 1000)
      const timeUntilExpiry = expiresAt - now
      
      if (timeUntilExpiry < 300) { // 5 minutes
        setIsExpiring(true)
      }
    }

    checkExpiration()
    const interval = setInterval(checkExpiration, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [session])

  const refresh = useCallback(async () => {
    try {
      const newSession = await refreshSession()
      setIsExpiring(false)
      return newSession
    } catch (err) {
      console.error('Failed to refresh session:', err)
      throw err
    }
  }, [])

  return {
    session,
    user,
    isExpiring,
    refresh,
    expiresAt: session?.expires_at,
  }
}

// Hook for multi-factor authentication
export function useMFA() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)

  const enroll = useCallback(async (factorType: 'totp' = 'totp') => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType,
        friendlyName: 'Authenticator App',
      })

      if (error) throw error
      
      setFactorId(data.id)
      return data
    } catch (err) {
      setError(err instanceof Error ? err : new Error('MFA enrollment failed'))
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const verify = useCallback(async (code: string, challengeId?: string) => {
    if (!factorId) {
      throw new Error('No MFA factor enrolled')
    }

    setLoading(true)
    setError(null)

    try {
      const verifyParams: { factorId: string; code: string; challengeId?: string } = {
        factorId,
        code,
      }
      if (challengeId) {
        verifyParams.challengeId = challengeId
      }
      
      const { data, error } = await supabase.auth.mfa.verify(verifyParams as any)

      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err : new Error('MFA verification failed'))
      throw err
    } finally {
      setLoading(false)
    }
  }, [factorId])

  const unenroll = useCallback(async (factorIdToRemove: string) => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: factorIdToRemove,
      })

      if (error) throw error
      
      if (factorId === factorIdToRemove) {
        setFactorId(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('MFA unenrollment failed'))
      throw err
    } finally {
      setLoading(false)
    }
  }, [factorId])

  const challenge = useCallback(async (factorIdToChallenge: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: factorIdToChallenge,
      })

      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err : new Error('MFA challenge failed'))
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const listFactors = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.mfa.listFactors()

      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to list MFA factors'))
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    enroll,
    verify,
    unenroll,
    challenge,
    listFactors,
    factorId,
    loading,
    error,
  }
}

// Hook for anonymous sign-in
export function useAnonymousAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { refreshUser } = useAuth()

  const signInAnonymously = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInAnonymously()
      if (error) throw error
      await refreshUser()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Anonymous sign-in failed'))
      throw err
    } finally {
      setLoading(false)
    }
  }, [refreshUser])

  const linkIdentity = useCallback(async (credentials: { email: string; password: string }) => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({
        email: credentials.email,
        password: credentials.password,
      })
      if (error) throw error
      await refreshUser()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to link identity'))
      throw err
    } finally {
      setLoading(false)
    }
  }, [refreshUser])

  return {
    signInAnonymously,
    linkIdentity,
    loading,
    error,
  }
}

// Hook for identity linking (OAuth)
export function useIdentityLinking() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { user, refreshUser } = useAuth()

  const linkIdentity = useCallback(async (provider: 'google' | 'github' | 'gitlab' | 'azure') => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.linkIdentity({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Identity linking failed'))
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const unlinkIdentity = useCallback(async (identity: { provider: string; identity_id: string; user_id?: string }) => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.unlinkIdentity(identity as any)
      if (error) throw error
      await refreshUser()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Identity unlinking failed'))
      throw err
    } finally {
      setLoading(false)
    }
  }, [refreshUser])

  const identities = user?.identities || []

  return {
    linkIdentity,
    unlinkIdentity,
    identities,
    loading,
    error,
  }
}

// Hook for user invitations
export function useUserInvitations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const inviteUser = useCallback(async (email: string, options?: { 
    redirectTo?: string
    data?: object 
  }) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: options?.redirectTo || `${window.location.origin}/auth/callback`,
        data: options?.data,
      })

      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Invitation failed'))
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { inviteUser, loading, error }
}

// Hook for nonce-based authentication (one-time use tokens)
export function useNonceAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const signInWithNonce = useCallback(async (nonce: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: nonce,
        type: 'magiclink',
      })

      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Nonce authentication failed'))
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { signInWithNonce, loading, error }
}

// Default export
export default {
  AuthProvider,
  useAuth,
  useRequireAuth,
  useIsAdmin,
  useUserMetadata,
  useOAuthCallback,
  usePasswordReset,
  useSession,
  useMFA,
  useAnonymousAuth,
  useIdentityLinking,
  useUserInvitations,
  useNonceAuth,
}
