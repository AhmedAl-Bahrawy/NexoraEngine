export { supabase, type SupabaseClient } from './client'

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
