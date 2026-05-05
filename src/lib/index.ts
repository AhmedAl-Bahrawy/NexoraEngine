// Nexora Engine - Core exports
export { createNexoraClient, getClient, getServiceClient, isInitialized, supabase } from './core/client'
export type { NexoraConfig, SupabaseClient, User, Session } from './core/client'

// Core engine
export { executeRequest } from './core/pipeline'
export type { RequestOptions } from './core/pipeline'

// Error layer
export {
  NexoraError,
  AuthError,
  DatabaseError,
  ValidationError,
  CacheError,
  RateLimitError,
  TimeoutError,
} from './errors/nexora-error'

// Validation layer
export {
  validate,
  safeValidate,
  createValidator,
  commonSchemas,
} from './validation'
export type { ValidationResult } from './validation'

// Cache layer
export { QueryCache } from './cache/cache'
export type { CacheEntry, CacheOptions, CacheStats } from './cache/cache'
export { deriveCacheKey, deriveMutationKeys } from './cache/keys'

// Query layer - Direct database operations
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
} from './database'

// Query layer - Builder and Engine
export {
  QueryEngine,
  QueryBuilder,
  createQuery,
  queryEngine,
} from './query-engine'

// Auth layer
export * from './auth'

// Storage layer
export * from './storage'

// Utilities
export * from './utils'

// Types
export type { GenericRow as DbRow, PaginatedResult } from '../types'
export type { Filter, SortConfig, PaginationConfig } from './query-engine/types'
