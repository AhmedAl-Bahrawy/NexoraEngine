export interface KeyComponents {
  table?: string
  operation?: string
  filters?: Record<string, unknown>
  order?: { column: string; ascending: boolean }
  pagination?: { limit: number; offset: number }
  columns?: string
  extra?: Record<string, unknown>
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
