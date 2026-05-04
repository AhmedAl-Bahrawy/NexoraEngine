/**
 * Auth Barrel Export
 * Central export for all authentication functionality
 */

// Client
export {
  supabase,
  type SupabaseClient,
  type User,
  type Session,
  type SupabaseAuthError,
} from './client'

// Operations
export {
  type SignInCredentials,
  type SignUpCredentials,
  type AuthResult,
  signInWithPassword,
  signUp,
  signOut,
  signInWithOTP,
  signInWithOAuth,
  resetPassword,
  updatePassword,
  updateUser,
  resendConfirmationEmail,
  getSession,
  getUser,
  isAuthenticated,
  refreshSession,
  exchangeCodeForSession,
  signInAnonymously,
  linkAnonymousAccount,
} from './operations'

// MFA
export {
  type MFAEnrollResult,
  type MFAVerifyResult,
  enrollTOTP,
  challengeMFA,
  verifyMFA,
  unenrollMFA,
  listMFAFactors,
  getAuthenticatorAssuranceLevel,
} from './mfa'

// Admin (server-side only)
export {
  type CreateUserParams,
  type ListUsersResult,
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateUserById,
  inviteUserByEmail,
  generateLink,
} from './admin'
