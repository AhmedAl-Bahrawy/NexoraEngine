export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'ilike'
  | 'is'
  | 'in'
  | 'contains'
  | 'contained'
  | 'overlap'
  | 'match'
  | 'not'

export interface Filter {
  column: string
  operator: FilterOperator
  value: unknown
}

export interface SortConfig {
  column: string
  ascending?: boolean
  nullsFirst?: boolean
  foreignTable?: string
}

export interface PaginationConfig {
  limit: number
  offset?: number
}

export interface QueryConfig<T = unknown> {
  table: string
  schema?: string
  columns?: string
  filters?: Filter[]
  sort?: SortConfig[]
  pagination?: PaginationConfig
  single?: boolean
  head?: boolean
  count?: 'exact' | 'planned' | 'estimated'
  foreignTables?: string[]
}

export function applyFilters(query: any, filters: Filter[]): any {
  let result = query

  for (const filter of filters) {
    result = applySingleFilter(result, filter)
  }

  return result
}

function applySingleFilter(query: any, filter: Filter): any {
  const { column, operator, value } = filter

  switch (operator) {
    case 'eq':
      return query.eq(column, value)
    case 'neq':
      return query.neq(column, value)
    case 'gt':
      return query.gt(column, value)
    case 'gte':
      return query.gte(column, value)
    case 'lt':
      return query.lt(column, value)
    case 'lte':
      return query.lte(column, value)
    case 'like':
      return query.like(column, value as string)
    case 'ilike':
      return query.ilike(column, value as string)
    case 'is':
      return query.is(column, value as boolean | null)
    case 'in':
      return query.in(column, value as unknown[])
    case 'contains':
      return query.contains(column, value as Record<string, unknown> | unknown[])
    case 'contained':
      return query.containedBy(column, value as Record<string, unknown> | unknown[])
    case 'overlap':
      return query.overlaps(column, value as unknown[])
    case 'match':
      return query.match(value as Record<string, unknown>)
    case 'not':
      return query.not(column, (value as { operator: FilterOperator; value: unknown }).operator, (value as { operator: FilterOperator; value: unknown }).value as string)
    default:
      return query.eq(column, value as string)
  }
}

export function applySort(query: any, sorts: SortConfig[]): any {
  let result = query

  for (const sort of sorts) {
    result = result.order(sort.column, {
      ascending: sort.ascending ?? true,
      nullsFirst: sort.nullsFirst,
      foreignTable: sort.foreignTable,
    })
  }

  return result
}

export function applyPagination(
  query: any,
  pagination: PaginationConfig
): any {
  const offset = pagination.offset ?? 0
  return query.range(offset, offset + pagination.limit - 1)
}
