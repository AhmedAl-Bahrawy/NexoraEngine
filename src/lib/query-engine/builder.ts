import { getClient } from '../core/client'
import { executeRequest } from '../core/pipeline'
import type { Filter, SortConfig } from './types'

export class QueryBuilder {
  private table: string
  private activeFilters: Filter[] = []
  private activeSort: SortConfig[] = []
  private activePagination: { page: number; pageSize: number } | null = null
  private selectColumns?: string
  private isSingle = false
  private headOnly = false
  private abortController: AbortController | null = null

  constructor(table: string, baseOptions?: { select?: string }) {
    this.table = table
    this.selectColumns = baseOptions?.select
  }

  filters(conditions: Filter[]): this {
    this.activeFilters.push(...conditions)
    return this
  }

  eq(column: string, value: unknown): this {
    this.activeFilters.push({ column, operator: 'eq', value })
    return this
  }

  neq(column: string, value: unknown): this {
    this.activeFilters.push({ column, operator: 'neq', value })
    return this
  }

  gt(column: string, value: unknown): this {
    this.activeFilters.push({ column, operator: 'gt', value })
    return this
  }

  gte(column: string, value: unknown): this {
    this.activeFilters.push({ column, operator: 'gte', value })
    return this
  }

  lt(column: string, value: unknown): this {
    this.activeFilters.push({ column, operator: 'lt', value })
    return this
  }

  lte(column: string, value: unknown): this {
    this.activeFilters.push({ column, operator: 'lte', value })
    return this
  }

  like(column: string, value: string): this {
    this.activeFilters.push({ column, operator: 'like', value })
    return this
  }

  ilike(column: string, value: string): this {
    this.activeFilters.push({ column, operator: 'ilike', value })
    return this
  }

  in(column: string, value: unknown[]): this {
    this.activeFilters.push({ column, operator: 'in', value })
    return this
  }

  is(column: string, value: unknown): this {
    this.activeFilters.push({ column, operator: 'is', value })
    return this
  }

  contains(column: string, value: unknown): this {
    this.activeFilters.push({ column, operator: 'contains', value })
    return this
  }

  containedBy(column: string, value: unknown): this {
    this.activeFilters.push({ column, operator: 'containedBy', value })
    return this
  }

  overlap(column: string, value: unknown): this {
    this.activeFilters.push({ column, operator: 'overlap', value })
    return this
  }

  match(value: Record<string, unknown>): this {
    this.activeFilters.push({ column: '', operator: 'match', value })
    return this
  }

  not(column: string, operator: string, value: unknown): this {
    this.activeFilters.push({ column, operator: 'not' as any, value: { operator, value } })
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

  single(): this {
    this.isSingle = true
    return this
  }

  head(): this {
    this.headOnly = true
    return this
  }

  abort(): this {
    if (!this.abortController) {
      this.abortController = new AbortController()
    }
    return this
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

  async execute(): Promise<{ data: unknown[] | null; error: Error | null; count: number }> {
    const supabase = getClient()
    let query = supabase.from(this.table).select(this.selectColumns ?? '*', { count: this.headOnly ? 'exact' : undefined, head: this.headOnly })

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

    if (this.isSingle) {
      query = (query as any).single()
    }

    const signal = this.abortController?.signal

    const result = await executeRequest<any>(
      () => Promise.resolve((query as any).then((r: any) => r)),
      { signal }
    )

    if (result?.error) {
      return { data: null, error: new Error(String(result.error)), count: 0 }
    }

    if (this.headOnly) {
      return { data: [], error: null, count: result?.count ?? 0 }
    }

    if (this.isSingle) {
      return {
        data: result?.data ? [result.data] : [],
        error: null,
        count: result?.count ?? 0,
      }
    }

    return {
      data: (result?.data ?? []) as unknown[],
      error: null,
      count: result?.count ?? 0,
    }
  }

  async executeSingle(): Promise<unknown | null> {
    const { data, error } = await this.single().execute()
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
      case 'contains': return query.contains(column, value)
      case 'containedBy': return query.containedBy(column, value)
      case 'overlap': return query.overlap(column, value)
      case 'match': return query.match(value as Record<string, unknown>)
      case 'not': {
        const notValue = value as { operator: string; value: unknown }
        return query.not(column, notValue.operator, notValue.value)
      }
      default: return query
    }
  }
}

export function createQuery(table: string, baseOptions?: { select?: string }): QueryBuilder {
  return new QueryBuilder(table, baseOptions)
}
