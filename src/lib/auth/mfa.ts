import { getSupabaseClient } from './client'
import { handleSupabaseError } from '../utils/errors'
import { withRetry } from '../utils/retry'
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

async function executeMfaQuery(fn: () => Promise<any>): Promise<any> {
  return withRetry(async () => {
    const result = await fn()
    if (result.error) throw result.error
    return result
  }, { retries: 2, delay: 1000 })
}

export async function enrollTOTP(friendlyName = 'Authenticator App'): Promise<MFAEnrollResult> {
  const supabase = getSupabaseClient()
  const result = await executeMfaQuery(
    () => supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName,
    })
  )

  return {
    id: result.data.id,
    type: 'totp',
    friendlyName: result.data.friendly_name ?? 'Authenticator App',
    qrCode: result.data.totp.qr_code,
    secret: result.data.totp.secret,
    uri: result.data.totp.uri,
  }
}

export async function challengeMFA(factorId: string): Promise<{ id: string; expires_at: number }> {
  const supabase = getSupabaseClient()
  const result = await executeMfaQuery(
    () => supabase.auth.mfa.challenge({ factorId })
  )
  return result.data
}

export async function verifyMFA(
  factorId: string,
  code: string,
  challengeId?: string
): Promise<MFAVerifyResult> {
  const supabase = getSupabaseClient()
  const result = await executeMfaQuery(
    () => (supabase.auth.mfa as any).verify({ factorId, code, challengeId })
  )

  return {
    user: {
      id: result.data.user.id,
      factors: result.data.user.factors ?? [],
    },
    accessToken: result.data.access_token,
    refreshToken: result.data.refresh_token,
  }
}

export async function unenrollMFA(factorId: string): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  if (error) throw handleSupabaseError(error)
}

export async function listMFAFactors(): Promise<{
  all: Factor[]
  totp: Factor[]
  phone: Factor[]
}> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw handleSupabaseError(error)

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
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error) throw handleSupabaseError(error)

  return {
    currentLevel: data.currentLevel,
    nextLevel: data.nextLevel,
    currentAuthenticationMethods: (data.currentAuthenticationMethods ?? []) as Array<{ method: string; timestamp: number }>,
  }
}
