export {
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
} from './queries'

export {
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
  subscribeToTable,
  subscribeToTables,
  getActiveSubscriptions,
  createBroadcastChannel,
  createPresenceChannel,
  unsubscribe,
  unsubscribeAll,
} from './realtime'

export type {
  FilterCondition,
  QueryOptions,
  PaginatedQueryOptions,
  PaginatedResult,
  AggregateResult,
} from './queries'

export type {
  RealtimeEvent,
  RealtimeChange,
  SubscriptionConfig,
  SubscriptionCallbacks,
  SubscriptionHandle,
} from './realtime'

export { getClient as getSupabaseClient } from '../core/client'
