import { getClient } from '../core/client'
import { AuthError } from '../errors/nexora-error'
import type { Factor } from '@supabase/supabase-js'

export interface MFAEnrollResult {
  id: string
  type: 'totp'
  friendlyName: string
  qrCode: string
  secret: string
  uri: string
}

export interface MFAVerifyResult {
  user: { id: string; factors: Factor[] }
  accessToken: string
  refreshToken: string
}

export async function enrollTOTP(friendlyName = 'Authenticator App'): Promise<MFAEnrollResult> {
  const supabase = getClient()
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName,
  })

  if (error) throw AuthError.from(error)

  return {
    id: data.id,
    type: 'totp',
    friendlyName: data.friendly_name ?? 'Authenticator App',
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  }
}

export async function challengeMFA(factorId: string): Promise<{ id: string; expires_at: number }> {
  const supabase = getClient()
  const { data, error } = await supabase.auth.mfa.challenge({ factorId })
  if (error) throw AuthError.from(error)
  return data
}

export async function verifyMFA(
  factorId: string,
  code: string,
  challengeId?: string
): Promise<MFAVerifyResult> {
  const supabase = getClient()
  const { data, error } = await (supabase.auth.mfa as any).verify({ factorId, code, challengeId })

  if (error) throw AuthError.from(error)

  return {
    user: {
      id: data.user.id,
      factors: data.user.factors ?? [],
    },
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  }
}

export async function unenrollMFA(factorId: string): Promise<void> {
  const supabase = getClient()
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  if (error) throw AuthError.from(error)
}

export async function listMFAFactors(): Promise<{
  all: Factor[]
  totp: Factor[]
  phone: Factor[]
}> {
  const supabase = getClient()
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw AuthError.from(error)

  return {
    all: [...(data.totp ?? []), ...(data.phone ?? [])],
    totp: data.totp ?? [],
    phone: data.phone ?? [],
  }
}

export async function getAuthenticatorAssuranceLevel(): Promise<{
  currentLevel: 'aal1' | 'aal2' | null
  nextLevel: 'aal1' | 'aal2' | null
  currentAuthenticationMethods: Array<{ method: string; timestamp: number }>
}> {
  const supabase = getClient()
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error) throw AuthError.from(error)

  return {
    currentLevel: data.currentLevel,
    nextLevel: data.nextLevel,
    currentAuthenticationMethods: (data.currentAuthenticationMethods ?? []) as Array<{ method: string; timestamp: number }>,
  }
}
