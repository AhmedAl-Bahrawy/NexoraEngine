export interface Filter {
  column: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'contains' | 'containedBy' | 'overlap' | 'is' | 'match' | 'not'
  value: unknown
}

export interface SortConfig {
  column: string
  ascending?: boolean
}

export interface PaginationConfig {
  limit?: number
  offset?: number
}

export interface CursorPaginationConfig {
  cursor?: string
  limit?: number
  cursorColumn?: string
}

export interface InfiniteScrollState<T> {
  data: T[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  cursor: string | null
  error: Error | null
  totalCount: number
}

export interface InfiniteScrollOptions {
  table: string
  columns?: string
  filters?: Filter[]
  sort?: SortConfig[]
  pageSize?: number
  cursorColumn?: string
  ttl?: number
  bypassCache?: boolean
  timeout?: number
  retries?: number
}

export interface OptimisticUpdateOptions<T> {
  table: string
  id: string
  data: Partial<T>
  rollbackData: Partial<T>
  updateFn: (data: Partial<T>) => Promise<T>
  onSuccess?: (result: T) => void
  onError?: (error: Error) => void
}

export type { CachedQueryOptions, PaginatedResponse, CursorPaginatedResponse } from './engine'
