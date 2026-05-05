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
  subscribeToRow,
  getActiveSubscriptions,
  getChannels,
  getChannelInfo,
  getChannelState,
  isChannelActive,
  getSubscribedChannels,
  getConnectionState,
  onConnectionChange,
  createBroadcastChannel,
  createPresenceChannel,
  unsubscribe,
  unsubscribeAll,
  reconnect,
  RealtimeManager,
  realtime,
} from './realtime'

export type {
  RealtimeEvent,
  RealtimeChannelState,
  RealtimeConnectionState,
  RealtimeChange,
  ChannelInfo,
  SubscriptionConfig,
  SubscriptionCallbacks,
  SubscriptionHandle,
  TableSubscription,
  BroadcastChannelHandle,
  PresenceChannelHandle,
  PresenceCallbacks,
} from './realtime'

export type {
  FilterCondition,
  QueryOptions,
  PaginatedQueryOptions,
  PaginatedResult,
  AggregateResult,
} from './queries'

export { getClient as getSupabaseClient } from '../core/client'
