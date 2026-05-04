/**
 * Auth Operations
 * Authentication methods: sign in, sign up, sign out, password reset
 */

import { supabase } from './client'
import { handleSupabaseError, ValidationError } from '../utils/errors'
import { isValidEmail, validatePassword } from '../utils/validators'
import type { User, Session } from '@supabase/supabase-js'

// Types
export interface SignInCredentials {
  email: string
  password: string
}

export interface SignUpCredentials extends SignInCredentials {
  metadata?: Record<string, unknown>
}

export interface AuthResult {
  user: User | null
  session: Session | null
}

// Sign in with email/password
export async function signInWithPassword(credentials: SignInCredentials): Promise<AuthResult> {
  // Validate inputs
  if (!isValidEmail(credentials.email)) {
    throw new ValidationError('Invalid email format', { email: ['Please enter a valid email address'] })
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) throw error

    return {
      user: data.user,
      session: data.session,
    }
  } catch (err) {
    throw handleSupabaseError(err)
  }
}

// Sign up
export async function signUp(credentials: SignUpCredentials): Promise<AuthResult> {
  // Validate email
  if (!isValidEmail(credentials.email)) {
    throw new ValidationError('Invalid email format', { email: ['Please enter a valid email address'] })
  }

  // Validate password strength
  const passwordValidation = validatePassword(credentials.password)
  if (!passwordValidation.isValid) {
    throw new ValidationError('Weak password', { password: passwordValidation.errors })
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: credentials.metadata ? { data: credentials.metadata } : undefined,
    })

    if (error) throw error

    return {
      user: data.user,
      session: data.session,
    }
  } catch (err) {
    throw handleSupabaseError(err)
  }
}

// Sign out
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw handleSupabaseError(error)
}

// Sign in with OTP/Magic Link
export async function signInWithOTP(email: string): Promise<void> {
  if (!isValidEmail(email)) {
    throw new ValidationError('Invalid email format', { email: ['Please enter a valid email address'] })
  }

  const { error } = await supabase.auth.signInWithOtp({ email })
  if (error) throw handleSupabaseError(error)
}

// Sign in with OAuth
export async function signInWithOAuth(
  provider: 'google' | 'github' | 'gitlab' | 'azure' | 'bitbucket' | 'facebook'
): Promise<{ url: string; provider: string }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw handleSupabaseError(error)

  return {
    url: data.url,
    provider,
  }
}

// Reset password
export async function resetPassword(email: string): Promise<void> {
  if (!isValidEmail(email)) {
    throw new ValidationError('Invalid email format', { email: ['Please enter a valid email address'] })
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  if (error) throw handleSupabaseError(error)
}

// Update password
export async function updatePassword(newPassword: string): Promise<void> {
  const validation = validatePassword(newPassword)
  if (!validation.isValid) {
    throw new ValidationError('Weak password', { password: validation.errors })
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) throw handleSupabaseError(error)
}

// Update user
export async function updateUser(attributes: {
  email?: string
  password?: string
  data?: Record<string, unknown>
}): Promise<User> {
  const { data, error } = await supabase.auth.updateUser(attributes)
  if (error) throw handleSupabaseError(error)
  return data.user
}

// Resend confirmation email
export async function resendConfirmationEmail(email: string): Promise<void> {
  if (!isValidEmail(email)) {
    throw new ValidationError('Invalid email format', { email: ['Please enter a valid email address'] })
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  })

  if (error) throw handleSupabaseError(error)
}

// Get current session
export async function getSession(): Promise<Session | null> {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw handleSupabaseError(error)
  return session
}

// Get current user
export async function getUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw handleSupabaseError(error)
  return user
}

// Check if authenticated
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return !!session
}

// Refresh session
export async function refreshSession(): Promise<Session | null> {
  const { data: { session }, error } = await supabase.auth.refreshSession()
  if (error) throw handleSupabaseError(error)
  return session
}

// Exchange code for session (OAuth callback)
export async function exchangeCodeForSession(code: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) throw handleSupabaseError(error)
  return {
    user: data.user,
    session: data.session,
  }
}

// Anonymous sign in
export async function signInAnonymously(): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw handleSupabaseError(error)
  return {
    user: data.user,
    session: data.session,
  }
}

// Link anonymous account to permanent credentials
export async function linkAnonymousAccount(
  email: string,
  password: string
): Promise<User> {
  const { data, error } = await supabase.auth.updateUser({
    email,
    password,
  })

  if (error) throw handleSupabaseError(error)
  return data.user
}
