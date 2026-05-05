import { QueryCache } from '../cache/cache'
import { deriveCacheKey, deriveMutationKeys } from '../cache/keys'
import { QueryBuilder, createQuery } from './builder'
import type { Filter, SortConfig, PaginationConfig } from './types'
import type { GenericRow } from '../../types'
import {
  fetchAll,
  fetchById,
  fetchWhere,
  fetchPaginated,
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
  count,
} from '../database'

export interface CachedQueryOptions {
  table: string
  columns?: string
  filters?: Filter[]
  sort?: SortConfig[]
  pagination?: PaginationConfig
  ttl?: number
  bypassCache?: boolean
  timeout?: number
  retries?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export class QueryEngine {
  private cache: QueryCache
  private pendingQueries: Map<string, Promise<unknown>>

  constructor(cache?: QueryCache) {
    this.cache = cache ?? QueryCache.getInstance()
    this.pendingQueries = new Map()
  }

  getCache(): QueryCache {
    return this.cache
  }

  async query<T>(options: CachedQueryOptions): Promise<T[]> {
    if (options.bypassCache) {
      const result = await this.executeAndCache(options, true)
      return result as T[]
    }

    const cacheKey = this.buildQueryKey(options)
    const cached = this.cache.get<T[]>(cacheKey)

    if (cached !== null) {
      return cached
    }

    if (this.pendingQueries.has(cacheKey)) {
      return this.pendingQueries.get(cacheKey) as Promise<T[]>
    }

    const promise = this.executeAndCache(options).then(r => r as T[])
    this.pendingQueries.set(cacheKey, promise as Promise<unknown>)

    try {
      const result = await promise
      return result
    } finally {
      this.pendingQueries.delete(cacheKey)
    }
  }

  async querySingle(
    table: string,
    filters: Filter[],
    options?: { columns?: string; ttl?: number; bypassCache?: boolean; timeout?: number; retries?: number }
  ): Promise<unknown | null> {
    if (options?.bypassCache) {
      return this.fetchSingle(table, filters, options?.columns, options?.timeout, options?.retries)
    }

    const cacheKey = deriveCacheKey({
      table,
      operation: 'single',
      filters: this.filtersToObject(filters),
      columns: options?.columns,
    })

    const cached = this.cache.get<unknown>(cacheKey)
    if (cached !== null) return cached

    const result = await this.fetchSingle(table, filters, options?.columns, options?.timeout, options?.retries)
    if (result) {
      this.cache.set(cacheKey, result, options?.ttl)
    }
    return result
  }

  async queryPaginated(
    options: CachedQueryOptions & { page?: number; pageSize?: number }
  ): Promise<PaginatedResponse<unknown>> {
    const page = options.page ?? 1
    const pageSize = options.pageSize ?? 20
    const pagination: PaginationConfig = {
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }

    if (options.bypassCache) {
      return this.executePaginated({ ...options, pagination }, page, pageSize)
    }

    const cacheKey = deriveCacheKey({
      table: options.table,
      operation: 'paginated',
      filters: options.filters ? this.filtersToObject(options.filters) : undefined,
      sort: options.sort?.[0] ? { column: options.sort[0].column, ascending: options.sort[0].ascending ?? false } : undefined,
      pagination: pagination ? { limit: pagination.limit!, offset: pagination.offset ?? 0 } : undefined,
      columns: options.columns,
    })

    const cached = this.cache.get<PaginatedResponse<unknown>>(cacheKey)
    if (cached !== null) return cached

    const result = await this.executePaginated({ ...options, pagination }, page, pageSize)
    this.cache.set(cacheKey, result, options.ttl)
    return result
  }

  async queryCount(
    table: string,
    filters?: Filter[],
    options?: { bypassCache?: boolean; ttl?: number; timeout?: number; retries?: number }
  ): Promise<number> {
    if (options?.bypassCache) {
      return this.fetchCount(table, filters, options?.timeout, options?.retries)
    }

    const cacheKey = deriveCacheKey({
      table,
      operation: 'count',
      filters: filters ? this.filtersToObject(filters) : undefined,
    })

    const cached = this.cache.get<number>(cacheKey)
    if (cached !== null) return cached

    const result = await this.fetchCount(table, filters, options?.timeout, options?.retries)
    this.cache.set(cacheKey, result, options?.ttl ?? 30_000)
    return result
  }

  async create(table: string, data: Record<string, unknown>): Promise<unknown> {
    const result = await insertOne(table, data)
    this.invalidateTable(table)
    return result
  }

  async createMany(table: string, data: Record<string, unknown>[]): Promise<unknown[]> {
    const result = await insertMany(table, data)
    this.invalidateTable(table)
    return result
  }

  async update(table: string, id: string, data: Partial<Record<string, unknown>>): Promise<unknown> {
    const result = await updateById(table, id, data)
    this.invalidateTable(table)
    return result
  }

  async updateWhere(
    table: string,
    conditions: Record<string, unknown>,
    data: Partial<Record<string, unknown>>
  ): Promise<unknown[]> {
    const result = await updateWhere(table, conditions, data)
    this.invalidateTable(table)
    return result
  }

  async upsert(table: string, data: Record<string, unknown>): Promise<unknown> {
    const result = await upsert(table, data)
    this.invalidateTable(table)
    return result
  }

  async remove(table: string, id: string): Promise<void> {
    await deleteById(table, id)
    this.invalidateTable(table)
  }

  async removeWhere(table: string, conditions: Record<string, unknown>): Promise<number> {
    const result = await deleteWhere(table, conditions)
    this.invalidateTable(table)
    return result
  }

  invalidateTable(table: string): void {
    const patterns = deriveMutationKeys(table)
    for (const pattern of patterns) {
      this.cache.invalidatePattern(pattern)
    }
  }

  invalidateKey(key: string): boolean {
    return this.cache.invalidate(key)
  }

  invalidateAll(): void {
    this.cache.invalidateAll()
  }

  getCacheStats() {
    return this.cache.getStats()
  }

  createQuery(table: string): QueryBuilder {
    return createQuery(table)
  }

  private async executeAndCache(options: CachedQueryOptions, bypassCache = false): Promise<unknown[]> {
    const result = await fetchAll(options.table, {
      select: options.columns,
      filters: options.filters,
      orderBy: options.sort?.map(s => ({ column: s.column, ascending: s.ascending })),
      limit: options.pagination?.limit,
      offset: options.pagination?.offset,
      timeout: options.timeout,
      retries: options.retries,
    })

    if (!bypassCache && result.data) {
      const cacheKey = this.buildQueryKey(options)
      this.cache.set(cacheKey, result.data, options.ttl)
    }

    return result.data ?? []
  }

  private async executePaginated(
    options: CachedQueryOptions & { pagination: PaginationConfig },
    page: number,
    pageSize: number
  ): Promise<PaginatedResponse<unknown>> {
    const result = await fetchPaginated(options.table, {
      page,
      pageSize,
      filters: options.filters,
      orderBy: options.sort?.map(s => ({ column: s.column, ascending: s.ascending })),
      select: options.columns,
      timeout: options.timeout,
      retries: options.retries,
    })

    return {
      data: result.data ?? [],
      count: result.count,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    }
  }

  private async fetchSingle(
    table: string,
    filters: Filter[],
    columns?: string,
    timeout?: number,
    retries?: number
  ): Promise<unknown | null> {
    const conditions: Record<string, unknown> = {}
    for (const f of filters) {
      if (f.operator === 'eq') {
        conditions[f.column] = f.value
      }
    }

    if (Object.keys(conditions).length === 1 && conditions.id) {
      const result = await fetchById(table, conditions.id as string, {
        select: columns,
        timeout,
        retries,
      })
      return result.data
    }

    const results = await fetchWhere(table, filters, {
      select: columns,
      limit: 1,
      timeout,
      retries,
    })

    return results.data?.[0] ?? null
  }

  private async fetchCount(
    table: string,
    filters?: Filter[],
    timeout?: number,
    retries?: number
  ): Promise<number> {
    return count(table, filters)
  }

  private buildQueryKey(options: CachedQueryOptions): string {
    return deriveCacheKey({
      table: options.table,
      operation: 'query',
      filters: options.filters ? this.filtersToObject(options.filters) : undefined,
      sort: options.sort?.[0] ? { column: options.sort[0].column, ascending: options.sort[0].ascending ?? false } : undefined,
      pagination: options.pagination ? { limit: options.pagination.limit!, offset: options.pagination.offset ?? 0 } : undefined,
      columns: options.columns,
    })
  }

  private filtersToObject(filters: Filter[]): Record<string, unknown> {
    const obj: Record<string, unknown> = {}
    for (const f of filters) {
      obj[f.column] = f.value
    }
    return obj
  }
}

export const queryEngine = new QueryEngine()
