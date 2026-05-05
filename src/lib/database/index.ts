export { getSupabaseClient as supabase, type SupabaseClient } from './client'

export {
  type QueryOptions,
  type PaginatedQueryOptions,
  type PaginatedResult,
  type FilterCondition,
  type AggregateResult,
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

export {
  type BulkInsertItem,
  type BulkUpdateItem,
  type MutationOptions,
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
  runSequential,
} from './mutations'

export {
  type RealtimeEvent,
  type RealtimeChange,
  type SubscriptionConfig,
  type SubscriptionCallbacks,
  type SubscriptionHandle,
  subscribeToTable,
  subscribeToTables,
  getActiveSubscriptions,
  createBroadcastChannel,
  createPresenceChannel,
  unsubscribe,
  unsubscribeAll,
} from './realtime'
