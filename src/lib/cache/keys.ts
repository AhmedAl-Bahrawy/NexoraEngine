export interface KeyComponents {
  table?: string
  operation?: string
  filters?: Record<string, unknown>
  sort?: { column: string; ascending: boolean }
  order?: { column: string; ascending: boolean }
  pagination?: { limit: number; offset: number } | null
  columns?: string
  extra?: Record<string, unknown>
}

export class CacheKey {
  static fromComponents(components: KeyComponents): string {
    return deriveCacheKey(components)
  }

  static fromQuery(
    table: string,
    options?: {
      select?: string
      filters?: unknown
      orderBy?: { column: string; ascending?: boolean }[]
      limit?: number
      offset?: number
      range?: { from: number; to: number }
    }
  ): string {
    return deriveCacheKey({
      table,
      operation: 'query',
      columns: options?.select,
      filters: options?.filters as Record<string, unknown> | undefined,
      order: options?.orderBy?.[0]
        ? { column: options.orderBy[0].column, ascending: options.orderBy[0].ascending ?? false }
        : undefined,
      pagination: options?.limit
        ? {
            limit: options.limit,
            offset: options.offset ?? 0,
          }
        : options?.range
          ? { limit: options.range.to - options.range.from + 1, offset: options.range.from }
          : undefined,
    })
  }

  static tablePrefix(table: string): string {
    return `qb:${table}:`
  }

  static forTable(table: string, id?: string): string {
    return deriveTableKey(table, id)
  }

  static forMutation(table: string): string[] {
    return deriveMutationKeys(table)
  }
}

export function deriveCacheKey(components: KeyComponents): string {
  const parts: string[] = []

  if (components.table) {
    parts.push(components.table)
  }

  if (components.operation) {
    parts.push(components.operation)
  }

  if (components.columns) {
    parts.push(`cols:${components.columns}`)
  }

  if (components.filters) {
    parts.push(`filters:${stableStringify(components.filters)}`)
  }

  if (components.order) {
    parts.push(`order:${components.order.column}:${components.order.ascending ? 'asc' : 'desc'}`)
  }

  if (components.pagination) {
    parts.push(`page:${components.pagination.limit}:${components.pagination.offset}`)
  }

  if (components.extra) {
    parts.push(`extra:${stableStringify(components.extra)}`)
  }

  return parts.length > 0 ? `qb:${parts.join('|')}` : 'qb:default'
}

function stableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return 'null'
  if (typeof obj !== 'object') return String(obj)

  if (Array.isArray(obj)) {
    return `[${obj.map(stableStringify).join(',')}]`
  }

  const keys = Object.keys(obj as Record<string, unknown>).sort()
  const pairs = keys.map(key => {
    const value = (obj as Record<string, unknown>)[key]
    return `${key}:${stableStringify(value)}`
  })

  return `{${pairs.join(',')}}`
}

export function deriveTableKey(table: string, id?: string): string {
  return id ? `qb:${table}:${id}` : `qb:${table}:all`
}

export function deriveMutationKeys(table: string): string[] {
  return [
    `qb:${table}:`,
    `qb:${table}:all`,
  ]
}
