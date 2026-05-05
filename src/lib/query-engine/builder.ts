import { getSupabaseClient } from '../auth/client'
import {
  applyFilters,
  applySort,
  applyPagination,
  type Filter,
  type SortConfig,
  type PaginationConfig,
  type QueryConfig,
} from './types'
import { handleSupabaseError } from '../utils/errors'

export class QueryBuilder<T = unknown> {
  private config: QueryConfig<T>

  constructor(table: string) {
    this.config = {
      table,
      schema: 'public',
      filters: [],
      sort: [],
    }
  }

  select(columns = '*'): this {
    this.config.columns = columns
    return this
  }

  where(column: string, operator: Filter['operator'], value: unknown): this {
    this.config.filters = this.config.filters ?? []
    this.config.filters.push({ column, operator, value })
    return this
  }

  eq(column: string, value: unknown): this {
    return this.where(column, 'eq', value)
  }

  neq(column: string, value: unknown): this {
    return this.where(column, 'neq', value)
  }

  gt(column: string, value: unknown): this {
    return this.where(column, 'gt', value)
  }

  gte(column: string, value: unknown): this {
    return this.where(column, 'gte', value)
  }

  lt(column: string, value: unknown): this {
    return this.where(column, 'lt', value)
  }

  lte(column: string, value: unknown): this {
    return this.where(column, 'lte', value)
  }

  like(column: string, value: string): this {
    return this.where(column, 'like', value)
  }

  ilike(column: string, value: string): this {
    return this.where(column, 'ilike', value)
  }

  is(column: string, value: boolean | null): this {
    return this.where(column, 'is', value)
  }

  in(column: string, values: unknown[]): this {
    return this.where(column, 'in', values)
  }

  contains(column: string, value: Record<string, unknown> | unknown[]): this {
    return this.where(column, 'contains', value)
  }

  orderBy(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): this {
    this.config.sort = this.config.sort ?? []
    this.config.sort.push({
      column,
      ascending: options?.ascending ?? true,
      nullsFirst: options?.nullsFirst,
    })
    return this
  }

  limit(limit: number): this {
    this.config.pagination = {
      ...this.config.pagination,
      limit,
    }
    return this
  }

  offset(offset: number): this {
    this.config.pagination = {
      ...(this.config.pagination ?? { limit: 1000 }),
      offset,
    }
    return this
  }

  paginate(page: number, pageSize: number): this {
    this.config.pagination = {
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }
    return this
  }

  single(): this {
    this.config.single = true
    return this
  }

  head(): this {
    this.config.head = true
    return this
  }

  withCount(mode: 'exact' | 'planned' | 'estimated' = 'exact'): this {
    this.config.count = mode
    return this
  }

  inSchema(schema: string): this {
    this.config.schema = schema
    return this
  }

  get configSnapshot(): Readonly<QueryConfig<T>> {
    return { ...this.config }
  }

  async execute(): Promise<T[]> {
    const supabase = getSupabaseClient()
    const countOption = this.config.head ? { count: this.config.count, head: true } : { count: this.config.count }

    let query = (supabase as any)
      .from(this.config.table)
      .select(this.config.columns ?? '*', countOption)

    if (this.config.filters?.length) {
      query = applyFilters(query, this.config.filters)
    }

    if (this.config.sort?.length) {
      query = applySort(query, this.config.sort)
    }

    if (this.config.pagination) {
      query = applyPagination(query, this.config.pagination)
    }

    if (this.config.head) {
      const { count, error } = await query
      if (error) throw handleSupabaseError(error)
      return [{ count } as unknown as T]
    }

    const { data, error, count } = await query

    if (error) throw handleSupabaseError(error)

    return (data ?? []) as T[]
  }

  async executeSingle(): Promise<T | null> {
    const supabase = getSupabaseClient()
    const countOption = this.config.count ? { count: this.config.count } : undefined

    let query = (supabase as any)
      .from(this.config.table)
      .select(this.config.columns ?? '*', countOption)

    if (this.config.filters?.length) {
      query = applyFilters(query, this.config.filters)
    }

    if (this.config.sort?.length) {
      query = applySort(query, this.config.sort)
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw handleSupabaseError(error)
    }

    return data as T
  }

  async executeCount(): Promise<number> {
    const supabase = getSupabaseClient()
    let query = (supabase as any)
      .from(this.config.table)
      .select('*', { count: 'exact', head: true })

    if (this.config.filters?.length) {
      query = applyFilters(query, this.config.filters)
    }

    const { count, error } = await query

    if (error) throw handleSupabaseError(error)

    return count ?? 0
  }
}

export function createQuery<T = unknown>(table: string): QueryBuilder<T> {
  return new QueryBuilder<T>(table)
}
