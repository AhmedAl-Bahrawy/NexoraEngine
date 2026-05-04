import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { 
  supabase, 
  getCurrentSession, 
  getCurrentUser,
  type SupabaseClient,
  type User,
  type Session 
} from '../lib/supabase'

// ==================== TYPES ====================

interface SupabaseContextValue {
  // Client
  supabase: SupabaseClient
  
  // Auth state
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Connection state
  isConnected: boolean
  connectionError: Error | null
  
  // Actions
  refreshSession: () => Promise<void>
  refreshUser: () => Promise<void>
}

interface SupabaseProviderProps {
  children: ReactNode
  fallback?: ReactNode
}

// ==================== CONTEXT ====================

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined)

// ==================== PROVIDER ====================

export function SupabaseProvider({ children, fallback }: SupabaseProviderProps) {
  // Auth state
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Connection state
  const [isConnected, setIsConnected] = useState(true)
  const [connectionError, setConnectionError] = useState<Error | null>(null)

  const isAuthenticated = !!user && !!session

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const currentSession = await getCurrentSession()
      setSession(currentSession)
      setIsConnected(true)
      setConnectionError(null)
    } catch (err) {
      setConnectionError(err instanceof Error ? err : new Error('Failed to refresh session'))
      setIsConnected(false)
    }
  }, [])

  // Refresh user
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setIsConnected(true)
      setConnectionError(null)
    } catch (err) {
      setConnectionError(err instanceof Error ? err : new Error('Failed to refresh user'))
      setIsConnected(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true)
        
        // Get session first
        const currentSession = await getCurrentSession()
        setSession(currentSession)
        
        // Then get user
        if (currentSession) {
          const currentUser = await getCurrentUser()
          setUser(currentUser)
        }
        
        setIsConnected(true)
        setConnectionError(null)
      } catch (err) {
        console.error('Supabase initialization error:', err)
        setConnectionError(err instanceof Error ? err : new Error('Failed to initialize'))
        setIsConnected(false)
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [])

  // Subscribe to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        // Log auth events in development
        if (import.meta.env.DEV) {
          console.log(`[Supabase Auth] Event: ${event}`, currentSession)
        }

        // Handle specific events
        switch (event) {
          case 'INITIAL_SESSION':
            break
          case 'SIGNED_IN':
            setIsConnected(true)
            break
          case 'SIGNED_OUT':
            setUser(null)
            setSession(null)
            break
          case 'PASSWORD_RECOVERY':
            // Handle password recovery flow
            break
          case 'TOKEN_REFRESHED':
            setIsConnected(true)
            break
          case 'USER_UPDATED':
            break
          case 'MFA_CHALLENGE_VERIFIED':
            break
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Connection health check
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Simple health check - try to get session
        await supabase.auth.getSession()
        if (!isConnected) {
          setIsConnected(true)
          setConnectionError(null)
        }
      } catch (err) {
        setIsConnected(false)
        setConnectionError(err instanceof Error ? err : new Error('Connection lost'))
      }
    }

    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000)

    // Also check on online/offline events
    const handleOnline = () => {
      checkConnection()
    }

    const handleOffline = () => {
      setIsConnected(false)
      setConnectionError(new Error('Network connection lost'))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isConnected])

  const value: SupabaseContextValue = {
    supabase,
    user,
    session,
    isAuthenticated,
    isLoading,
    isConnected,
    connectionError,
    refreshSession,
    refreshUser,
  }

  // Show fallback while loading
  if (isLoading && fallback) {
    return <>{fallback}</>
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}

// ==================== HOOK ====================

export function useSupabaseContext(): SupabaseContextValue {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabaseContext must be used within a SupabaseProvider')
  }
  return context
}

// ==================== CONVENIENCE EXPORTS ====================

// Re-export auth-related values
export function useSupabaseUser(): User | null {
  const { user } = useSupabaseContext()
  return user
}

export function useSupabaseSession(): Session | null {
  const { session } = useSupabaseContext()
  return session
}

export function useIsSupabaseConnected(): boolean {
  const { isConnected, isLoading } = useSupabaseContext()
  return isConnected && !isLoading
}

export function useSupabaseConnectionError(): Error | null {
  const { connectionError } = useSupabaseContext()
  return connectionError
}

export function useSupabaseLoading(): boolean {
  const { isLoading } = useSupabaseContext()
  return isLoading
}

// Default export
export default SupabaseProvider
