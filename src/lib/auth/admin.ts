import { getClient } from '../core/client'
import { AuthError } from '../errors/nexora-error'
import type { User } from '@supabase/supabase-js'

export interface CreateUserParams {
  email: string
  password?: string
  emailConfirm?: boolean
  phone?: string
  userMetadata?: Record<string, unknown>
  appMetadata?: Record<string, unknown>
}

export interface ListUsersResult {
  users: User[]
  total: number
}

export interface AdminUpdateParams {
  email?: string
  password?: string
  userMetadata?: Record<string, unknown>
  appMetadata?: Record<string, unknown>
  emailConfirm?: boolean
  phone?: string
  phoneConfirm?: boolean
  banDuration?: string
}

export interface InviteOptions {
  redirectTo?: string
  data?: Record<string, unknown>
}

export interface GenerateLinkOptions {
  password?: string
  data?: Record<string, unknown>
  redirectTo?: string
}

export async function createUser(params: CreateUserParams): Promise<User> {
  const supabase = getClient()
  const { data, error } = await supabase.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: params.emailConfirm ?? true,
    phone: params.phone,
    user_metadata: params.userMetadata,
    app_metadata: params.appMetadata,
  })

  if (error) throw AuthError.from(error)
  return data.user
}

export async function deleteUser(userId: string): Promise<void> {
  const supabase = getClient()
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) throw AuthError.from(error)
}

export async function getUserById(userId: string): Promise<User> {
  const supabase = getClient()
  const { data, error } = await supabase.auth.admin.getUserById(userId)
  if (error) throw AuthError.from(error)
  return data.user
}

export async function listUsers(options?: { page?: number; perPage?: number }): Promise<ListUsersResult> {
  const supabase = getClient()
  const { data, error } = await supabase.auth.admin.listUsers({
    page: options?.page,
    perPage: options?.perPage,
  })

  if (error) throw AuthError.from(error)

  return {
    users: data.users,
    total: (data as any).total ?? data.users.length,
  }
}

export async function updateUserById(userId: string, attributes: AdminUpdateParams): Promise<User> {
  const supabase = getClient()
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    email: attributes.email,
    password: attributes.password,
    user_metadata: attributes.userMetadata,
    app_metadata: attributes.appMetadata,
    email_confirm: attributes.emailConfirm,
    phone: attributes.phone,
    phone_confirm: attributes.phoneConfirm,
    ban_duration: attributes.banDuration,
  })

  if (error) throw AuthError.from(error)
  return data.user
}

export async function inviteUserByEmail(email: string, options?: InviteOptions): Promise<User> {
  const supabase = getClient()
  const redirectUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: options?.redirectTo ?? `${redirectUrl}/auth/callback`,
    data: options?.data,
  })

  if (error) throw AuthError.from(error)
  return data.user
}

export async function generateLink(
  type: 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change_current' | 'email_change_new',
  email: string,
  options?: GenerateLinkOptions
): Promise<any> {
  const supabase = getClient()
  const { data, error } = await (supabase.auth.admin as any).generateLink({
    type,
    email,
    password: options?.password,
    options: {
      redirectTo: options?.redirectTo,
      data: options?.data,
    },
  })

  if (error) throw AuthError.from(error)
  return data
}
