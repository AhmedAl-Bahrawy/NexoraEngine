export {
  getClient as getSupabaseClient,
  createNexoraClient as createSupabaseClient,
  isInitialized,
  type SupabaseClient,
  type User,
  type Session,
} from '../core/client'

export type { NexoraConfig as SupabaseConfig } from '../core/client'

export {
  type SignInCredentials,
  type SignUpCredentials,
  type AuthResult,
  type OAuthOptions,
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
  verifyOTP,
  onAuthStateChange,
} from './operations'

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

export {
  type CreateUserParams,
  type ListUsersResult,
  type AdminUpdateParams,
  type InviteOptions,
  type GenerateLinkOptions,
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateUserById,
  inviteUserByEmail,
  generateLink,
} from './admin'

export {
  type AuthContext,
  type AuthMiddlewareOptions,
  enforceAuth,
  requireAuth,
  requireRole,
  requireAnyRole,
  requireVerifiedEmail,
  withAuth,
  hasRole,
  hasAnyRole,
  isAdmin,
} from './middleware'
