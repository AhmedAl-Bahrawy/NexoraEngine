/**
 * Database Queries
 * Fetch, filter, and retrieve data from Supabase tables
 */

import { supabase } from './client'
import { handleSupabaseError } from '../utils/errors'
import { validatePagination } from '../utils/validators'
import { DATABASE } from '../constants/supabase'

// Types
export interface QueryOptions {
  columns?: string
  filter?: (query: any) => any
  order?: { column: string; ascending?: boolean }
  limit?: number
  offset?: number
}

export interface PaginatedQueryOptions extends QueryOptions {
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

// Fetch all records from a table
export async function fetchAll<T>(
  table: string,
  options?: QueryOptions
): Promise<T[]> {
  let query = supabase.from(table).select(options?.columns || '*')

  if (options?.filter) {
    query = options.filter(query)
  }

  if (options?.order) {
    query = query.order(options.order.column, {
      ascending: options.order.ascending ?? true,
    })
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 1000) - 1)
  }

  const { data, error } = await query
  if (error) throw handleSupabaseError(error)
  return data as T[]
}

// Fetch single record by ID
export async function fetchById<T>(
  table: string,
  id: string,
  options?: { columns?: string }
): Promise<T | null> {
  const { data, error } = await supabase
    .from(table)
    .select(options?.columns || '*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw handleSupabaseError(error)
  }

  return data as T
}

// Fetch with custom filters
export async function fetchWhere<T>(
  table: string,
  conditions: Record<string, unknown>,
  options?: QueryOptions
): Promise<T[]> {
  let query = supabase.from(table).select(options?.columns || '*')

  Object.entries(conditions).forEach(([key, value]) => {
    query = query.eq(key, value)
  })

  if (options?.order) {
    query = query.order(options.order.column, {
      ascending: options.order.ascending ?? true,
    })
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query
  if (error) throw handleSupabaseError(error)
  return data as T[]
}

// Paginated query
export async function fetchPaginated<T>(
  table: string,
  options?: PaginatedQueryOptions
): Promise<PaginatedResult<T>> {
  const { page, pageSize } = validatePagination(
    options?.page || 1,
    options?.pageSize || DATABASE.DEFAULT_PAGE_SIZE
  )

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from(table)
    .select(options?.columns || '*', { count: 'exact' })

  if (options?.filter) {
    query = options.filter(query)
  }

  if (options?.order) {
    query = query.order(options.order.column, {
      ascending: options.order.ascending ?? true,
    })
  }

  const { data, error, count } = await query.range(from, to)

  if (error) throw handleSupabaseError(error)

  const totalPages = Math.ceil((count || 0) / pageSize)

  return {
    data: data as T[],
    count: count || 0,
    page,
    pageSize,
    totalPages,
  }
}

// Search with ILIKE (case-insensitive)
export async function search<T>(
  table: string,
  column: string,
  searchTerm: string,
  options?: QueryOptions
): Promise<T[]> {
  let query = supabase
    .from(table)
    .select(options?.columns || '*')
    .ilike(column, `%${searchTerm}%`)

  if (options?.order) {
    query = query.order(options.order.column, {
      ascending: options.order.ascending ?? true,
    })
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query
  if (error) throw handleSupabaseError(error)
  return data as T[]
}

// Full text search (requires pg_trgm or tsvector setup)
export async function fullTextSearch<T>(
  table: string,
  searchColumn: string,
  searchTerm: string,
  options?: QueryOptions
): Promise<T[]> {
  // This uses the textSearch method from Supabase
  let query = supabase
    .from(table)
    .select(options?.columns || '*')
    .textSearch(searchColumn, searchTerm)

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query
  if (error) throw handleSupabaseError(error)
  return data as T[]
}

// Count records
export async function count(
  table: string,
  options?: { filter?: (query: any) => any }
): Promise<number> {
  let query = supabase
    .from(table)
    .select('*', { count: 'exact', head: true })

  if (options?.filter) {
    query = options.filter(query)
  }

  const { count, error } = await query
  if (error) throw handleSupabaseError(error)
  return count || 0
}

// Check if record exists
export async function exists(
  table: string,
  conditions: Record<string, unknown>
): Promise<boolean> {
  let query = supabase
    .from(table)
    .select('id', { count: 'exact', head: true })

  Object.entries(conditions).forEach(([key, value]) => {
    query = query.eq(key, value)
  })

  const { count, error } = await query.limit(1)
  if (error) throw handleSupabaseError(error)
  return (count || 0) > 0
}

// Get distinct values
export async function distinct<T>(
  table: string,
  column: string
): Promise<T[]> {
  const { data, error } = await supabase.rpc('get_distinct_values', {
    p_table: table,
    p_column: column,
  })

  if (error) {
    // Fallback if RPC doesn't exist
    const { data: fallbackData, error: fallbackError } = await supabase
      .from(table)
      .select(column)

    if (fallbackError) throw handleSupabaseError(fallbackError)

    const uniqueValues = [...new Set((fallbackData || []).map((d: any) => d[column]))]
    return uniqueValues as T[]
  }

  return data as T[]
}

// Aggregate functions
export async function aggregate<T = number>(
  table: string,
  operation: 'avg' | 'count' | 'max' | 'min' | 'sum',
  column: string
): Promise<T> {
  const { data, error } = await supabase.rpc('aggregate_table', {
    p_table: table,
    p_operation: operation,
    p_column: column,
  })

  if (error) throw handleSupabaseError(error)
  return data as T
}

// Query builder for complex queries
export function createQuery(table: string) {
  return {
    select: (columns = '*') => supabase.from(table).select(columns),
    insert: (data: any) => supabase.from(table).insert(data as any),
    update: (data: any) => supabase.from(table).update(data as any),
    delete: () => supabase.from(table).delete(),
    upsert: (data: any) => supabase.from(table).upsert(data as any),
  }
}
