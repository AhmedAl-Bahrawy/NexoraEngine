/**
 * Auth Admin Operations
 * Server-side admin operations (requires service role key)
 * ⚠️ These should only be used in secure server environments
 */

import { supabase } from './client'
import { handleSupabaseError } from '../utils/errors'
import type { User } from '@supabase/supabase-js'

// Types
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

// Create user (admin only)
export async function createUser(params: CreateUserParams): Promise<User> {
  const { data, error } = await supabase.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: params.emailConfirm ?? true,
    phone: params.phone,
    user_metadata: params.userMetadata,
    app_metadata: params.appMetadata,
  })

  if (error) throw handleSupabaseError(error)
  return data.user
}

// Delete user (admin only)
export async function deleteUser(userId: string): Promise<void> {
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) throw handleSupabaseError(error)
}

// Get user by ID (admin only)
export async function getUserById(userId: string): Promise<User> {
  const { data, error } = await supabase.auth.admin.getUserById(userId)
  if (error) throw handleSupabaseError(error)
  return data.user
}

// List all users (admin only)
export async function listUsers(options?: {
  page?: number
  perPage?: number
}): Promise<ListUsersResult> {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: options?.page,
    perPage: options?.perPage,
  })

  if (error) throw handleSupabaseError(error)
  
  return {
    users: data.users,
    total: (data as any).total || data.users.length,
  }
}

// Update user by ID (admin only)
export async function updateUserById(
  userId: string,
  attributes: {
    email?: string
    password?: string
    userMetadata?: Record<string, unknown>
    appMetadata?: Record<string, unknown>
    emailConfirm?: boolean
    phone?: string
    phoneConfirm?: boolean
    banDuration?: string
  }
): Promise<User> {
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

  if (error) throw handleSupabaseError(error)
  return data.user
}

// Invite user by email (admin only)
export async function inviteUserByEmail(
  email: string,
  options?: {
    redirectTo?: string
    data?: Record<string, unknown>
  }
): Promise<User> {
  const redirectUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: options?.redirectTo || `${redirectUrl}/auth/callback`,
    data: options?.data,
  })

  if (error) throw handleSupabaseError(error)
  return data.user
}

// Generate link (admin only)
export async function generateLink(
  type: 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change_current' | 'email_change_new',
  email: string,
  options?: {
    password?: string
    data?: Record<string, unknown>
    redirectTo?: string
  }
): Promise<{
  properties: {
    action_link: string
    email_otp: string
    hashed_token: string
    redirect_to: string
    verification_type: string
  }
}> {
  const generateLinkParams: any = {
    type,
    email,
    password: options?.password,
    options: {
      redirectTo: options?.redirectTo,
      data: options?.data,
    },
  }
  const { data, error } = await supabase.auth.admin.generateLink(generateLinkParams)

  if (error) throw handleSupabaseError(error)
  return data as any
}
