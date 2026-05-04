/**
 * MFA (Multi-Factor Authentication)
 * TOTP and Phone-based MFA operations
 */

import { supabase } from './client'
import { handleSupabaseError } from '../utils/errors'
import type { Factor } from '@supabase/supabase-js'

// Types
export interface MFAEnrollResult {
  id: string
  type: 'totp'
  friendlyName: string
  qrCode: string // QR code for authenticator app
  secret: string // Secret for manual entry
  uri: string // Full TOTP URI
}

export interface MFAVerifyResult {
  user: { id: string; factors: Factor[] }
  accessToken: string
  refreshToken: string
}

// Enroll TOTP factor
export async function enrollTOTP(friendlyName = 'Authenticator App'): Promise<MFAEnrollResult> {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName,
  })

  if (error) throw handleSupabaseError(error)

  return {
    id: data.id,
    type: 'totp',
    friendlyName: data.friendly_name || 'Authenticator App',
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  }
}

// Challenge MFA (start verification)
export async function challengeMFA(factorId: string): Promise<{ id: string; expires_at: number }> {
  const { data, error } = await supabase.auth.mfa.challenge({ factorId })
  if (error) throw handleSupabaseError(error)
  return data
}

// Verify MFA code
export async function verifyMFA(
  factorId: string,
  code: string,
  challengeId?: string
): Promise<MFAVerifyResult> {
  const verifyParams: { factorId: string; code: string; challengeId?: string } = {
    factorId,
    code,
  }
  
  if (challengeId) {
    verifyParams.challengeId = challengeId
  }

  const { data, error } = await supabase.auth.mfa.verify(verifyParams as any)
  if (error) throw handleSupabaseError(error)

  return {
    user: {
      id: data.user.id,
      factors: data.user.factors || [],
    },
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  }
}

// Unenroll factor
export async function unenrollMFA(factorId: string): Promise<void> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  if (error) throw handleSupabaseError(error)
}

// List enrolled factors
export async function listMFAFactors(): Promise<{
  all: Factor[]
  totp: Factor[]
  phone: Factor[]
}> {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw handleSupabaseError(error)

  return {
    all: [...(data.totp || []), ...(data.phone || [])],
    totp: data.totp || [],
    phone: data.phone || [],
  }
}

// Get authenticator assurance level
export async function getAuthenticatorAssuranceLevel(): Promise<{
  currentLevel: 'aal1' | 'aal2' | null
  nextLevel: 'aal1' | 'aal2' | null
  currentAuthenticationMethods: Array<{ method: string; timestamp: number }>
}> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error) throw handleSupabaseError(error)

  return {
    currentLevel: data.currentLevel,
    nextLevel: data.nextLevel,
    currentAuthenticationMethods: (data.currentAuthenticationMethods || []) as Array<{ method: string; timestamp: number }>,
  }
}
