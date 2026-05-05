export { supabase, type SupabaseClient } from './auth/client'

export * from './auth'

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
  type MutationOptions,
  type BulkInsertItem,
  type BulkUpdateItem,
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
} from './database'

export * from './storage'

export * from './utils'

export * from './constants'

export * from './cache'

export {
  QueryEngine,
  QueryBuilder,
  createQuery as createQueryBuilder,
  type CachedQueryOptions,
  type PaginatedResponse,
  queryEngine,
} from './query-engine'

export type { GenericRow as DbRow } from '../types'
