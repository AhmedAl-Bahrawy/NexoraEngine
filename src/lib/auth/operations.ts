import { getClient } from '../core/client'
import { AuthError, ValidationError } from '../errors/nexora-error'
import { executeRequest } from '../core/pipeline'
import { isValidEmail, validatePassword } from '../utils/validators'
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

export async function signInWithPassword(credentials: SignInCredentials): Promise<AuthResult> {
  if (!isValidEmail(credentials.email)) {
    throw new ValidationError('Invalid email format', {
      fieldErrors: { email: ['Please enter a valid email address'] },
    })
  }

  const supabase = getClient()

  const { data, error } = await executeRequest(
    () => supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })
  )

  if (error) {
    throw new AuthError(String(error), { cause: error as unknown as Error })
  }

  return { user: data?.user ?? null, session: data?.session ?? null }
}

export async function signUp(credentials: SignUpCredentials): Promise<AuthResult> {
  if (!isValidEmail(credentials.email)) {
    throw new ValidationError('Invalid email format', {
      fieldErrors: { email: ['Please enter a valid email address'] },
    })
  }

  const passwordValidation = validatePassword(credentials.password)
  if (!passwordValidation.isValid) {
    throw new ValidationError('Weak password', {
      fieldErrors: { password: passwordValidation.errors },
    })
  }

  const supabase = getClient()

  const { data, error } = await executeRequest(
    () => supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: credentials.metadata ? { data: credentials.metadata } : undefined,
    })
  )

  if (error) {
    throw new AuthError(String(error), { cause: error as unknown as Error })
  }

  return { user: data?.user ?? null, session: data?.session ?? null }
}

export async function signOut(): Promise<void> {
  const supabase = getClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw new AuthError(String(error), { cause: error as unknown as Error })
}

export async function signInWithOTP(email: string): Promise<void> {
  if (!isValidEmail(email)) {
    throw new ValidationError('Invalid email format', {
      fieldErrors: { email: ['Please enter a valid email address'] },
    })
  }

  const supabase = getClient()
  const { error } = await supabase.auth.signInWithOtp({ email })
  if (error) throw new AuthError(String(error), { cause: error as unknown as Error })
}

export async function signInWithOAuth(options: OAuthOptions): Promise<{ url: string; provider: string }> {
  const supabase = getClient()
  const redirectUrl = options.redirectTo ?? (typeof window !== 'undefined' ? window.location.origin : '')

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: options.provider,
    options: {
      redirectTo: `${redirectUrl}/auth/callback`,
      scopes: options.scopes,
    },
  })

  if (error) throw new AuthError(String(error), { cause: error as unknown as Error })

  return { url: data.url, provider: options.provider }
}

export async function resetPassword(email: string, redirectTo?: string): Promise<void> {
  if (!isValidEmail(email)) {
    throw new ValidationError('Invalid email format', {
      fieldErrors: { email: ['Please enter a valid email address'] },
    })
  }

  const supabase = getClient()
  const redirectUrl = redirectTo ?? (typeof window !== 'undefined' ? window.location.origin : '')

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${redirectUrl}/auth/reset-password`,
  })

  if (error) throw new AuthError(String(error), { cause: error as unknown as Error })
}

export async function updatePassword(newPassword: string): Promise<void> {
  const validation = validatePassword(newPassword)
  if (!validation.isValid) {
    throw new ValidationError('Weak password', {
      fieldErrors: { password: validation.errors },
    })
  }

  const supabase = getClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw new AuthError(String(error), { cause: error as unknown as Error })
}

export async function updateUser(attributes: {
  email?: string
  password?: string
  data?: Record<string, unknown>
}): Promise<User> {
  const supabase = getClient()
  const { data, error } = await supabase.auth.updateUser(attributes)
  if (error) throw new AuthError(String(error), { cause: error as unknown as Error })
  return data.user
}

export async function resendConfirmationEmail(email: string): Promise<void> {
  if (!isValidEmail(email)) {
    throw new ValidationError('Invalid email format', {
      fieldErrors: { email: ['Please enter a valid email address'] },
    })
  }

  const supabase = getClient()
  const { error } = await supabase.auth.resend({ type: 'signup', email })
  if (error) throw new AuthError(String(error), { cause: error as unknown as Error })
}

export async function getSession(): Promise<Session | null> {
  const supabase = getClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw new AuthError(String(error), { cause: error as unknown as Error })
  return session
}

export async function getUser(): Promise<User | null> {
  const supabase = getClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw new AuthError(String(error), { cause: error as unknown as Error })
  return user
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return !!session
}

export async function refreshSession(): Promise<Session | null> {
  const supabase = getClient()
  const { data: { session }, error } = await supabase.auth.refreshSession()
  if (error) throw new AuthError(String(error), { cause: error as unknown as Error })
  return session
}

export async function exchangeCodeForSession(code: string): Promise<AuthResult> {
  const supabase = getClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) throw new AuthError(String(error), { cause: error as unknown as Error })
  return { user: data.user, session: data.session }
}

export async function signInAnonymously(): Promise<AuthResult> {
  const supabase = getClient()
  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw new AuthError(String(error), { cause: error as unknown as Error })
  return { user: data.user, session: data.session }
}

export async function linkAnonymousAccount(email: string, password: string): Promise<User> {
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.isValid) {
    throw new ValidationError('Weak password', {
      fieldErrors: { password: passwordValidation.errors },
    })
  }

  const supabase = getClient()
  const { data, error } = await supabase.auth.updateUser({ email, password })
  if (error) throw new AuthError(String(error), { cause: error as unknown as Error })
  return data.user
}

export async function verifyOTP(params: {
  email: string
  token: string
  type?: 'email' | 'recovery' | 'invite' | 'magiclink'
}): Promise<AuthResult> {
  const supabase = getClient()
  const { data, error } = await supabase.auth.verifyOtp({
    email: params.email,
    token: params.token,
    type: params.type ?? 'email',
  })

  if (error) throw new AuthError(String(error), { cause: error as unknown as Error })
  return { user: data.user, session: data.session }
}

export async function onAuthStateChange(callback: (event: string, session: Session | null) => void): Promise<{ unsubscribe: () => void }> {
  const supabase = getClient()
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)

  return {
    unsubscribe: () => {
      subscription.unsubscribe()
    },
  }
}
