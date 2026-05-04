/**
 * Database Barrel Export
 * Central export for all database operations
 */

// Client
export { supabase, type SupabaseClient } from './client'

// Queries
export {
  type QueryOptions,
  type PaginatedQueryOptions,
  type PaginatedResult,
  fetchAll,
  fetchById,
  fetchWhere,
  fetchPaginated,
  search,
  fullTextSearch,
  count,
  exists,
  distinct,
  aggregate,
  createQuery,
} from './queries'

// Mutations
export {
  type BulkInsertItem,
  type BulkUpdateItem,
  insertOne,
  insertMany,
  updateById,
  updateWhere,
  upsert,
  deleteById,
  deleteWhere,
  deleteMany,
  softDelete,
  restore,
  bulkInsert,
  bulkUpdate,
  transaction,
} from './mutations'

// Realtime
export {
  type RealtimeEvent,
  type RealtimeChange,
  type SubscriptionConfig,
  type SubscriptionCallbacks,
  subscribeToTable,
  useSubscription,
  createBroadcastChannel,
  createPresenceChannel,
  unsubscribe,
  unsubscribeAll,
} from './realtime'

// Teams
export {
  type Team,
  type TeamMember,
  type CreateTeamParams,
  type AddMemberParams,
  createTeam,
  getUserTeams,
  getTeamMembers,
  addTeamMember,
  updateMemberRole,
  removeTeamMember,
  leaveTeam,
  deleteTeam,
  getTeamById,
  subscribeToTeam,
  unsubscribeFromTeam,
} from './teams'
