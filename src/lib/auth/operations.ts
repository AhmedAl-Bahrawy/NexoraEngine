import { getSupabaseClient } from './client'
import { handleSupabaseError, ValidationError } from '../utils/errors'
import { withRetry } from '../utils/retry'
import { isValidEmail, validatePassword } from '../utils/validators'
import { AUTH } from '../constants/supabase'
import type { User, Session } from '@supabase/supabase-js'

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

export interface OAuthOptions {
  provider: 'google' | 'github' | 'gitlab' | 'azure' | 'bitbucket' | 'facebook'
  redirectTo?: string
  scopes?: string
}

async function withAuthRetry<T>(fn: () => Promise<{ data: T; error: unknown }>, retries = 2): Promise<T> {
  return withRetry(async () => {
    const result = await fn()
    if (result.error) throw result.error
    return result.data
  }, { retries, delay: 1000 })
}

export async function signInWithPassword(credentials: SignInCredentials): Promise<AuthResult> {
  if (!isValidEmail(credentials.email)) {
    throw new ValidationError('Invalid email format', { email: ['Please enter a valid email address'] })
  }

  const supabase = getSupabaseClient()
  const data = await withAuthRetry<{ user: User | null; session: Session | null }>(
    () => supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })
  )

  return { user: data.user, session: data.session }
}

export async function signUp(credentials: SignUpCredentials): Promise<AuthResult> {
  if (!isValidEmail(credentials.email)) {
    throw new ValidationError('Invalid email format', { email: ['Please enter a valid email address'] })
  }

  const passwordValidation = validatePassword(credentials.password)
  if (!passwordValidation.isValid) {
    throw new ValidationError('Weak password', { password: passwordValidation.errors })
  }

  const supabase = getSupabaseClient()
  const data = await withAuthRetry<{ user: User | null; session: Session | null }>(
    () => supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: credentials.metadata ? { data: credentials.metadata } : undefined,
    })
  )

  return { user: data.user, session: data.session }
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw handleSupabaseError(error)
}

export async function signInWithOTP(email: string): Promise<void> {
  if (!isValidEmail(email)) {
    throw new ValidationError('Invalid email format', { email: ['Please enter a valid email address'] })
  }

  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signInWithOtp({ email })
  if (error) throw handleSupabaseError(error)
}

export async function signInWithOAuth(options: OAuthOptions): Promise<{ url: string; provider: string }> {
  const supabase = getSupabaseClient()
  const redirectUrl = options.redirectTo ?? (typeof window !== 'undefined' ? window.location.origin : '')

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: options.provider,
    options: {
      redirectTo: `${redirectUrl}/auth/callback`,
      scopes: options.scopes,
    },
  })

  if (error) throw handleSupabaseError(error)

  return { url: data.url, provider: options.provider }
}

export async function resetPassword(email: string, redirectTo?: string): Promise<void> {
  if (!isValidEmail(email)) {
    throw new ValidationError('Invalid email format', { email: ['Please enter a valid email address'] })
  }

  const supabase = getSupabaseClient()
  const redirectUrl = redirectTo ?? (typeof window !== 'undefined' ? window.location.origin : '')

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${redirectUrl}/auth/reset-password`,
  })

  if (error) throw handleSupabaseError(error)
}

export async function updatePassword(newPassword: string): Promise<void> {
  const validation = validatePassword(newPassword)
  if (!validation.isValid) {
    throw new ValidationError('Weak password', { password: validation.errors })
  }

  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw handleSupabaseError(error)
}

export async function updateUser(attributes: {
  email?: string
  password?: string
  data?: Record<string, unknown>
}): Promise<User> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.updateUser(attributes)
  if (error) throw handleSupabaseError(error)
  return data.user
}

export async function resendConfirmationEmail(email: string): Promise<void> {
  if (!isValidEmail(email)) {
    throw new ValidationError('Invalid email format', { email: ['Please enter a valid email address'] })
  }

  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.resend({ type: 'signup', email })
  if (error) throw handleSupabaseError(error)
}

export async function getSession(): Promise<Session | null> {
  const supabase = getSupabaseClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw handleSupabaseError(error)
  return session
}

export async function getUser(): Promise<User | null> {
  const supabase = getSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw handleSupabaseError(error)
  return user
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return !!session
}

export async function refreshSession(): Promise<Session | null> {
  const supabase = getSupabaseClient()
  const { data: { session }, error } = await supabase.auth.refreshSession()
  if (error) throw handleSupabaseError(error)
  return session
}

export async function exchangeCodeForSession(code: string): Promise<AuthResult> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) throw handleSupabaseError(error)
  return { user: data.user, session: data.session }
}

export async function signInAnonymously(): Promise<AuthResult> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw handleSupabaseError(error)
  return { user: data.user, session: data.session }
}

export async function linkAnonymousAccount(email: string, password: string): Promise<User> {
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.isValid) {
    throw new ValidationError('Weak password', { password: passwordValidation.errors })
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.updateUser({ email, password })
  if (error) throw handleSupabaseError(error)
  return data.user
}

export async function verifyOTP(params: {
  email: string
  token: string
  type?: 'email' | 'recovery' | 'invite' | 'magiclink'
}): Promise<AuthResult> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.verifyOtp({
    email: params.email,
    token: params.token,
    type: params.type ?? 'email',
  })

  if (error) throw handleSupabaseError(error)
  return { user: data.user, session: data.session }
}

export async function onAuthStateChange(callback: (event: string, session: Session | null) => void): Promise<{ unsubscribe: () => void }> {
  const supabase = getSupabaseClient()
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)

  return {
    unsubscribe: () => {
      subscription.unsubscribe()
    },
  }
}
