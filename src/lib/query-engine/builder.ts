import { getClient } from '../core/client'
import { executeRequest } from '../core/pipeline'
import type { Filter, SortConfig } from './types'

export class QueryBuilder {
  private table: string
  private activeFilters: Filter[] = []
  private activeSort: SortConfig[] = []
  private activePagination: { page: number; pageSize: number } | null = null
  private selectColumns?: string

  constructor(table: string, baseOptions?: { select?: string }) {
    this.table = table
    this.selectColumns = baseOptions?.select
  }

  filters(conditions: Filter[]): this {
    this.activeFilters.push(...conditions)
    return this
  }

  sort(sortConfig: SortConfig[]): this {
    this.activeSort = sortConfig
    return this
  }

  paginate(page: number, pageSize: number): this {
    this.activePagination = { page, pageSize }
    return this
  }

  select(columns: string): this {
    this.selectColumns = columns
    return this
  }

  async execute(): Promise<{ data: unknown[] | null; error: Error | null; count: number }> {
    const supabase = getClient()
    let query = supabase.from(this.table).select(this.selectColumns ?? '*')

    for (const filter of this.activeFilters) {
      query = this.applyFilter(query, filter)
    }

    for (const sort of this.activeSort) {
      query = query.order(sort.column, { ascending: sort.ascending ?? false })
    }

    if (this.activePagination) {
      const { page, pageSize } = this.activePagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = (query as any).range(from, to)
    }

    const result = await executeRequest<any>(
      () => Promise.resolve((query as any).then((r: any) => r)),
    )

    if (result?.error) {
      return { data: null, error: new Error(String(result.error)), count: 0 }
    }

    return {
      data: (result?.data ?? []) as unknown[],
      error: null,
      count: result?.count ?? 0,
    }
  }

  async executeSingle(): Promise<unknown | null> {
    const { data, error } = await this.execute()
    if (error || !data || data.length === 0) return null
    return data[0]
  }

  async count(): Promise<number> {
    const supabase = getClient()
    let query = supabase.from(this.table).select('*', { count: 'exact', head: true })

    for (const filter of this.activeFilters) {
      query = this.applyFilter(query, filter)
    }

    const result = await executeRequest<any>(
      () => Promise.resolve((query as any).then((r: any) => r)),
    )

    return result?.count ?? 0
  }

  private applyFilter(query: any, filter: Filter): any {
    const { column, operator, value } = filter
    switch (operator) {
      case 'eq': return query.eq(column, value)
      case 'neq': return query.neq(column, value)
      case 'gt': return query.gt(column, value)
      case 'gte': return query.gte(column, value)
      case 'lt': return query.lt(column, value)
      case 'lte': return query.lte(column, value)
      case 'like': return query.like(column, String(value))
      case 'ilike': return query.ilike(column, String(value))
      case 'in': return query.in(column, value as unknown[])
      case 'is': return query.is(column, value)
      default: return query
    }
  }
}

export function createQuery(table: string, baseOptions?: { select?: string }): QueryBuilder {
  return new QueryBuilder(table, baseOptions)
}
