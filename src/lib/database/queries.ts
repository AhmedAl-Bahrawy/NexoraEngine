import type { GenericRow } from '../../types'
import { getClient } from '../core/client'
import { QueryCache } from '../cache/cache'
import { deriveCacheKey, deriveMutationKeys } from '../cache/keys'
import { DatabaseError } from '../errors/nexora-error'
import { executeRequest } from '../core/pipeline'
import { DATABASE } from '../constants/supabase'

export interface FilterCondition {
  column: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'contains' | 'containedBy' | 'overlap' | 'is' | 'match'
  value: unknown
}

export interface QueryOptions {
  select?: string
  filters?: FilterCondition[]
  orderBy?: { column: string; ascending?: boolean }[]
  limit?: number
  offset?: number
  range?: { from: number; to: number }
  headers?: Record<string, string>
  ttl?: number
  useCache?: boolean
  timeout?: number
  retries?: number
}

export interface PaginatedQueryOptions extends QueryOptions {
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  data: T[] | null
  count: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface AggregateResult {
  count?: number
  sum?: Record<string, number>
  avg?: Record<string, number>
  min?: Record<string, unknown>
  max?: Record<string, unknown>
}

function applyFilters(query: any, filters: FilterCondition[]): any {
  let result = query

  for (const filter of filters) {
    const { column, operator, value } = filter
    switch (operator) {
      case 'eq': result = result.eq(column, value); break
      case 'neq': result = result.neq(column, value); break
      case 'gt': result = result.gt(column, value); break
      case 'gte': result = result.gte(column, value); break
      case 'lt': result = result.lt(column, value); break
      case 'lte': result = result.lte(column, value); break
      case 'like': result = result.like(column, String(value)); break
      case 'ilike': result = result.ilike(column, String(value)); break
      case 'in': result = result.in(column, value as unknown[]); break
      case 'contains': result = result.contains(column, value); break
      case 'containedBy': result = result.containedBy(column, value); break
      case 'overlap': result = result.overlap(column, value); break
      case 'is': result = result.is(column, value); break
      case 'match': result = result.match(value as Record<string, unknown>); break
    }
  }

  return result
}

function applySorting(query: any, orderBy: { column: string; ascending?: boolean }[]): any {
  let result = query
  for (const sort of orderBy) {
    result = result.order(sort.column, { ascending: sort.ascending ?? false })
  }
  return result
}

async function executeQuery<T>(query: any, options?: { timeout?: number; retries?: number }): Promise<T> {
  return executeRequest(
    () => query.then((r: any) => r),
    { timeout: options?.timeout, retries: options?.retries }
  )
}

export async function fetchAll<T extends GenericRow = GenericRow>(
  table: string,
  options?: QueryOptions
): Promise<{ data: T[] | null; error: Error | null; count: number }> {
  const supabase = getClient()
  let query = supabase.from(table).select(options?.select ?? '*')

  if (options?.filters?.length) {
    query = applyFilters(query, options.filters)
  }

  if (options?.orderBy?.length) {
    query = applySorting(query, options.orderBy)
  }

  if (options?.range) {
    query = (query as any).range(options.range.from, options.range.to)
  } else {
    if (options?.limit) query = (query as any).limit(options.limit)
    if (options?.offset) query = (query as any).offset(options.offset)
  }

  const isCached = options?.useCache !== false
  const cacheKey = isCached ? deriveCacheKey({
    table,
    operation: 'query',
    filters: options?.filters ? Object.fromEntries(options.filters.map(f => [f.column, f.value])) : undefined,
    columns: options?.select,
  }) : null

  if (isCached && cacheKey) {
    const cache = QueryCache.getInstance()
    const cached = cache.get<{ data: T[]; count: number }>(cacheKey)
    if (cached) {
      return { data: cached.data, error: null, count: cached.count }
    }
  }

  const result = await executeQuery<any>(query, { timeout: options?.timeout, retries: options?.retries })

  if (result.error) {
    throw new DatabaseError(String(result.error), { cause: result.error as Error })
  }

  if (isCached && cacheKey && result.data) {
    const cache = QueryCache.getInstance()
    cache.set(cacheKey, { data: result.data as T[], count: result.count ?? 0 }, options?.ttl)
  }

  return {
    data: result.data as T[] | null,
    error: null,
    count: result.count ?? 0,
  }
}

export async function fetchById<T extends GenericRow = GenericRow>(
  table: string,
  id: string | number,
  options?: Omit<QueryOptions, 'filters' | 'limit' | 'offset' | 'range'>
): Promise<{ data: T | null; error: Error | null }> {
  const supabase = getClient()
  let query = supabase.from(table).select(options?.select ?? '*').eq('id', id)

  if (options?.orderBy?.length) {
    query = applySorting(query, options.orderBy)
  }

  const result = await executeQuery<any>(query.single(), { timeout: options?.timeout, retries: options?.retries })

  if (result.error) {
    throw new DatabaseError(String(result.error), { cause: result.error as Error })
  }

  return {
    data: result.data as T | null,
    error: null,
  }
}

export async function fetchWhere<T extends GenericRow = GenericRow>(
  table: string,
  filters: FilterCondition[],
  options?: Omit<QueryOptions, 'filters'>
): Promise<{ data: T[] | null; error: Error | null; count: number }> {
  return fetchAll<T>(table, { ...options, filters })
}

export async function fetchPaginated<T extends GenericRow = GenericRow>(
  table: string,
  options?: PaginatedQueryOptions
): Promise<PaginatedResult<T>> {
  const page = options?.page ?? DATABASE.PAGINATION.DEFAULT_PAGE
  const pageSize = options?.pageSize ?? DATABASE.PAGINATION.DEFAULT_PAGE_SIZE

  if (pageSize > DATABASE.PAGINATION.MAX_PAGE_SIZE) {
    throw new DatabaseError('Page size exceeds maximum allowed', { details: { pageSize, max: DATABASE.PAGINATION.MAX_PAGE_SIZE } })
  }

  const supabase = getClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = (supabase.from(table) as any).select(options?.select ?? '*').range(from, to).count('exact')

  if (options?.filters?.length) {
    query = applyFilters(query, options.filters)
  }

  if (options?.orderBy?.length) {
    query = applySorting(query, options.orderBy)
  }

  const isCached = options?.useCache !== false
  const cacheKey = isCached ? deriveCacheKey({
    table,
    operation: 'paginated',
    filters: options?.filters ? Object.fromEntries(options.filters.map(f => [f.column, f.value])) : undefined,
    pagination: { limit: pageSize, offset: from },
    columns: options?.select,
  }) : null

  let result: any

  if (isCached && cacheKey) {
    const cache = QueryCache.getInstance()
    const cached = cache.get<{ data: T[]; count: number }>(cacheKey)
    if (cached) {
      result = { data: cached.data, count: cached.count, error: null }
    } else {
      result = await executeQuery<any>(query, { timeout: options?.timeout, retries: options?.retries })
      if (!result.error && result.data) {
        QueryCache.getInstance().set(cacheKey, { data: result.data as T[], count: result.count ?? 0 }, options?.ttl)
      }
    }
  } else {
    result = await executeQuery<any>(query, { timeout: options?.timeout, retries: options?.retries })
  }

  if (result.error) {
    throw new DatabaseError(String(result.error), { cause: result.error as Error })
  }

  const count = result.count ?? 0
  const totalPages = Math.ceil(count / pageSize)

  return {
    data: result.data as T[] | null,
    count,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}

export async function search<T extends GenericRow = GenericRow>(
  table: string,
  column: string,
  query: string,
  options?: Omit<QueryOptions, 'filters'>
): Promise<{ data: T[] | null; error: Error | null; count: number }> {
  return fetchAll<T>(table, {
    ...options,
    filters: [{ column, operator: 'ilike', value: `%${query}%` }],
  })
}

export async function fullTextSearch<T extends GenericRow = GenericRow>(
  table: string,
  column: string,
  query: string,
  options?: Omit<QueryOptions, 'filters'>
): Promise<{ data: T[] | null; error: Error | null; count: number }> {
  const supabase = getClient()
  let result = supabase.from(table).select(options?.select ?? '*').textSearch(column, query)

  if (options?.orderBy?.length) {
    result = applySorting(result, options.orderBy)
  }

  if (options?.limit) result = result.limit(options.limit)

  const queryResult = await executeQuery<any>(result, { timeout: options?.timeout, retries: options?.retries })

  if (queryResult.error) {
    throw new DatabaseError(String(queryResult.error), { cause: queryResult.error as Error })
  }

  return {
    data: queryResult.data as T[] | null,
    error: null,
    count: queryResult.count ?? 0,
  }
}

export async function count(
  table: string,
  filters?: FilterCondition[]
): Promise<number> {
  const supabase = getClient()
  let query = supabase.from(table).select('*', { count: 'exact', head: true })

  if (filters?.length) {
    query = applyFilters(query, filters)
  }

  const result = await executeQuery<any>(query)

  if (result.error) {
    throw new DatabaseError(String(result.error), { cause: result.error as Error })
  }

  return result.count ?? 0
}

export async function exists(
  table: string,
  filters: FilterCondition[]
): Promise<boolean> {
  const supabase = getClient()
  let query = supabase.from(table).select('id').limit(1)
  query = applyFilters(query, filters)

  const result = await executeQuery<any>(query)

  if (result.error) {
    throw new DatabaseError(String(result.error), { cause: result.error as Error })
  }

  return (result.data?.length ?? 0) > 0
}

export async function distinct<T extends GenericRow = GenericRow>(
  table: string,
  columns: string,
  options?: Omit<QueryOptions, 'select'>
): Promise<{ data: T[] | null; error: Error | null; count: number }> {
  const supabase = getClient()
  const query = supabase.from(table).select(columns, { count: 'exact' })

  let result = applyFilters(query, options?.filters ?? [])
  result = applySorting(result, options?.orderBy ?? [])

  const queryResult = await executeQuery<any>(query)

  if (queryResult.error) {
    throw new DatabaseError(String(queryResult.error), { cause: queryResult.error as Error })
  }

  return {
    data: queryResult.data as T[] | null,
    error: null,
    count: queryResult.count ?? 0,
  }
}

export async function aggregate(
  table: string,
  options?: {
    count?: boolean
    sum?: string[]
    avg?: string[]
    min?: string[]
    max?: string[]
    filters?: FilterCondition[]
    groupBy?: string[]
    timeout?: number
    retries?: number
  }
): Promise<AggregateResult> {
  const result: AggregateResult = {}

  if (options?.count) {
    result.count = await count(table, options.filters)
  }

  const numericAggregates = async (type: 'sum' | 'avg' | 'min' | 'max', columns?: string[]) => {
    if (!columns?.length) return

    const { data, error } = await fetchAll<GenericRow>(table, {
      select: columns.join(','),
      filters: options?.filters,
      timeout: options?.timeout,
      retries: options?.retries,
    })

    if (error || !data) return

    const numericResult = columns.reduce<Record<string, number>>((acc: Record<string, number>, col) => {
      const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined) as number[]
      if (values.length === 0) return acc

      const numValues = values.map(Number)
      if (type === 'sum') {
        acc[col] = numValues.reduce((s: number, v: number) => s + v, 0)
      } else if (type === 'avg') {
        acc[col] = numValues.reduce((s: number, v: number) => s + v, 0) / numValues.length
      } else if (type === 'min') {
        acc[col] = Math.min(...numValues)
      } else if (type === 'max') {
        acc[col] = Math.max(...numValues)
      }

      return acc
    }, {})

    result[type] = numericResult
  }

  await Promise.all([
    numericAggregates('sum', options?.sum),
    numericAggregates('avg', options?.avg),
    numericAggregates('min', options?.min),
    numericAggregates('max', options?.max),
  ])

  return result
}
