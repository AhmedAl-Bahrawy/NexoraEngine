import { getSession, getUser } from './operations'
import { AuthError, ForbiddenError } from '../errors/nexora-error'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthContext {
  user: User
  session: Session
  userId: string
  email?: string
  role?: string
}

export interface AuthMiddlewareOptions {
  requireEmail?: boolean
  requireRole?: string
  allowedRoles?: string[]
  customCheck?: (user: User) => boolean | Promise<boolean>
}

export async function enforceAuth(options?: AuthMiddlewareOptions): Promise<AuthContext> {
  const session = await getSession()

  if (!session) {
    throw new AuthError('No active session', { details: { code: 'unauthorized' } })
  }

  const user = await getUser()

  if (!user) {
    throw new AuthError('User not found', { details: { code: 'unauthorized' } })
  }

  if (options?.requireEmail && !user.email) {
    throw new AuthError('Email verification required', { details: { code: 'forbidden' } })
  }

  if (options?.requireRole) {
    const userRole = user.user_metadata?.role as string
    if (userRole !== options.requireRole) {
      throw new ForbiddenError(`Requires role: ${options.requireRole}`, { details: { requiredRole: options.requireRole, userRole } })
    }
  }

  if (options?.allowedRoles?.length) {
    const userRole = user.user_metadata?.role as string
    if (!options.allowedRoles.includes(userRole)) {
      throw new ForbiddenError(`Requires one of roles: ${options.allowedRoles.join(', ')}`, { details: { allowedRoles: options.allowedRoles, userRole } })
    }
  }

  if (options?.customCheck) {
    const passed = await options.customCheck(user)
    if (!passed) {
      throw new ForbiddenError('Custom authorization check failed')
    }
  }

  return {
    user,
    session,
    userId: user.id,
    email: user.email,
    role: user.user_metadata?.role as string,
  }
}

export async function requireAuth(): Promise<AuthContext> {
  return enforceAuth()
}

export async function requireRole(role: string): Promise<AuthContext> {
  return enforceAuth({ requireRole: role })
}

export async function requireAnyRole(roles: string[]): Promise<AuthContext> {
  return enforceAuth({ allowedRoles: roles })
}

export async function requireVerifiedEmail(): Promise<AuthContext> {
  return enforceAuth({ requireEmail: true })
}

export async function withAuth<T>(
  handler: (ctx: AuthContext) => Promise<T>,
  options?: AuthMiddlewareOptions
): Promise<T> {
  const ctx = await enforceAuth(options)
  return handler(ctx)
}

export function hasRole(user: User, role: string): boolean {
  return user.user_metadata?.role === role
}

export function hasAnyRole(user: User, roles: string[]): boolean {
  const userRole = user.user_metadata?.role as string
  return roles.includes(userRole)
}

export function isAdmin(user: User): boolean {
  return hasRole(user, 'admin')
}
