import { supabase } from '../auth/client'
import { QueryCache } from '../cache/cache'
import { deriveCacheKey, deriveTableKey, deriveMutationKeys, type KeyComponents } from '../cache/keys'
import { QueryBuilder, createQuery } from './builder'
import { type Filter, type SortConfig, type PaginationConfig } from './types'
import { handleSupabaseError } from '../utils/errors'
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
} from '../database'

export interface CachedQueryOptions {
  table: string
  columns?: string
  filters?: Filter[]
  sort?: SortConfig[]
  pagination?: PaginationConfig
  ttl?: number
  bypassCache?: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CachedMutationOptions {
  table: string
}

export class QueryEngine {
  private cache: QueryCache
  private pendingQueries: Map<string, Promise<unknown>>

  constructor(cache?: QueryCache) {
    this.cache = cache ?? new QueryCache()
    this.pendingQueries = new Map()
  }

  getCache(): QueryCache {
    return this.cache
  }

  async query<T = unknown>(options: CachedQueryOptions): Promise<T[]> {
    if (options.bypassCache) {
      return this.executeAndCache<T>(options)
    }

    const cacheKey = this.buildQueryKey(options)
    const cached = this.cache.get<T[]>(cacheKey)

    if (cached !== null) {
      return cached
    }

    if (this.pendingQueries.has(cacheKey)) {
      return this.pendingQueries.get(cacheKey) as Promise<T[]>
    }

    const promise = this.executeAndCache<T>(options)
    this.pendingQueries.set(cacheKey, promise)

    try {
      const result = await promise
      return result
    } finally {
      this.pendingQueries.delete(cacheKey)
    }
  }

  async querySingle<T = unknown>(
    table: string,
    filters: Filter[],
    options?: { columns?: string; ttl?: number; bypassCache?: boolean }
  ): Promise<T | null> {
    if (options?.bypassCache) {
      return this.fetchSingle<T>(table, filters, options?.columns)
    }

    const cacheKey = deriveCacheKey({
      table,
      operation: 'single',
      filters: this.filtersToObject(filters),
      columns: options?.columns,
    })

    const cached = this.cache.get<T>(cacheKey)
    if (cached !== null) return cached

    const result = await this.fetchSingle<T>(table, filters, options?.columns)
    if (result) {
      this.cache.set(cacheKey, result, options?.ttl)
    }
    return result
  }

  async queryPaginated<T = unknown>(
    options: CachedQueryOptions & { page?: number; pageSize?: number }
  ): Promise<PaginatedResponse<T>> {
    const page = options.page ?? 1
    const pageSize = options.pageSize ?? 20
    const pagination: PaginationConfig = {
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }

    if (options.bypassCache) {
      return this.executePaginated<T>({ ...options, pagination }, page, pageSize)
    }

    const cacheKey = deriveCacheKey({
      table: options.table,
      operation: 'paginated',
      filters: options.filters ? this.filtersToObject(options.filters) : undefined,
      sort: options.sort?.[0],
      pagination,
      columns: options.columns,
    })

    const cached = this.cache.get<PaginatedResponse<T>>(cacheKey)
    if (cached !== null) return cached

    const result = await this.executePaginated<T>({ ...options, pagination }, page, pageSize)
    this.cache.set(cacheKey, result, options.ttl)
    return result
  }

  async queryCount(
    table: string,
    filters?: Filter[],
    options?: { bypassCache?: boolean }
  ): Promise<number> {
    if (options?.bypassCache) {
      return this.fetchCount(table, filters)
    }

    const cacheKey = deriveCacheKey({
      table,
      operation: 'count',
      filters: filters ? this.filtersToObject(filters) : undefined,
    })

    const cached = this.cache.get<number>(cacheKey)
    if (cached !== null) return cached

    const result = await this.fetchCount(table, filters)
    this.cache.set(cacheKey, result, 30_000)
    return result
  }

  async create<T = unknown>(table: string, data: Record<string, unknown>, ttl?: number): Promise<T> {
    const result = await insertOne<T>(table, data)
    this.invalidateTable(table)
    return result
  }

  async createMany<T = unknown>(table: string, data: Record<string, unknown>[], ttl?: number): Promise<T[]> {
    const result = await insertMany<T>(table, data)
    this.invalidateTable(table)
    return result
  }

  async update<T = unknown>(table: string, id: string, data: Partial<Record<string, unknown>>): Promise<T> {
    const result = await updateById<T>(table, id, data)
    this.invalidateTable(table)
    return result
  }

  async updateWhere<T = unknown>(
    table: string,
    conditions: Record<string, unknown>,
    data: Partial<Record<string, unknown>>
  ): Promise<T[]> {
    const result = await updateWhere<T>(table, conditions, data)
    this.invalidateTable(table)
    return result
  }

  async upsert<T = unknown>(table: string, data: Record<string, unknown>): Promise<T> {
    const result = await upsert<T>(table, data)
    this.invalidateTable(table)
    return result
  }

  async remove(table: string, id: string): Promise<void> {
    await deleteById(table, id)
    this.invalidateTable(table)
  }

  async removeWhere(table: string, conditions: Record<string, unknown>): Promise<number> {
    const count = await deleteWhere(table, conditions)
    this.invalidateTable(table)
    return count
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

  createQuery<T = unknown>(table: string): QueryBuilder<T> {
    return createQuery<T>(supabase, table)
  }

  private async executeAndCache<T>(options: CachedQueryOptions): Promise<T[]> {
    const dbOptions = {
      columns: options.columns,
      order: options.sort?.[0] ? { column: options.sort[0].column, ascending: options.sort[0].ascending } : undefined,
      limit: options.pagination?.limit,
      offset: options.pagination?.offset,
      filter: options.filters?.length
        ? (q: unknown) => {
            let result = q
            for (const f of options.filters!) {
              result = (result as any)[f.operator](f.column, f.value)
            }
            return result
          }
        : undefined,
    }

    const result = await fetchAll<T>(options.table, dbOptions)

    const cacheKey = this.buildQueryKey(options)
    this.cache.set(cacheKey, result, options.ttl)

    return result
  }

  private async executePaginated<T>(
    options: CachedQueryOptions & { pagination: PaginationConfig },
    page: number,
    pageSize: number
  ): Promise<PaginatedResponse<T>> {
    const dbOptions = {
      columns: options.columns,
      page,
      pageSize,
      order: options.sort?.[0] ? { column: options.sort[0].column, ascending: options.sort[0].ascending } : undefined,
      filter: options.filters?.length
        ? (q: unknown) => {
            let result = q
            for (const f of options.filters!) {
              result = (result as any)[f.operator](f.column, f.value)
            }
            return result
          }
        : undefined,
    }

    const result = await fetchPaginated<T>(options.table, dbOptions)

    return {
      data: result.data,
      count: result.count,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    }
  }

  private async fetchSingle<T>(
    table: string,
    filters: Filter[],
    columns?: string
  ): Promise<T | null> {
    const conditions: Record<string, unknown> = {}
    for (const f of filters) {
      if (f.operator === 'eq') {
        conditions[f.column] = f.value
      }
    }

    if (Object.keys(conditions).length === 1 && conditions.id) {
      return fetchById<T>(table, conditions.id as string, { columns })
    }

    const results = await fetchWhere<T>(table, conditions, {
      columns,
      limit: 1,
    })

    return results[0] ?? null
  }

  private async fetchCount(table: string, filters?: Filter[]): Promise<number> {
    if (!filters?.length) {
      const { default: databaseModule } = await import('../database')
      const allData = await fetchAll<Record<string, unknown>>(table, { limit: 1 })
      return allData.length > 0 ? (await fetchAll<Record<string, unknown>>(table)).length : 0
    }

    const conditions: Record<string, unknown> = {}
    for (const f of filters) {
      if (f.operator === 'eq') {
        conditions[f.column] = f.value
      }
    }

    const results = await fetchWhere<Record<string, unknown>>(table, conditions)
    return results.length
  }

  private buildQueryKey(options: CachedQueryOptions): string {
    return deriveCacheKey({
      table: options.table,
      operation: 'query',
      filters: options.filters ? this.filtersToObject(options.filters) : undefined,
      sort: options.sort?.[0],
      pagination: options.pagination,
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
