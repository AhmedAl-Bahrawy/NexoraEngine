export interface Filter {
  column: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'contains' | 'containedBy' | 'overlap' | 'is' | 'match'
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

export type { CachedQueryOptions, PaginatedResponse } from './engine'
