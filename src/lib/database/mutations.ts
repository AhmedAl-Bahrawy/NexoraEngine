import { getClient } from '../core/client'
import { QueryCache } from '../cache/cache'
import { deriveCacheKey, deriveMutationKeys } from '../cache/keys'
import { DatabaseError } from '../errors/nexora-error'
import type { GenericRow } from '../../types'

export interface MutationOptions {
  select?: string
  timeout?: number
  retries?: number
  invalidateCache?: boolean
}

export interface BulkInsertItem<T> {
  data: T
}

export interface BulkUpdateItem<T> {
  id: string
  data: Partial<T>
}

function invalidateTableCache(table: string, options?: MutationOptions): void {
  if (options?.invalidateCache !== false) {
    const cache = QueryCache.getInstance()
    const patterns = deriveMutationKeys(table)
    for (const pattern of patterns) {
      cache.invalidatePattern(pattern)
    }
  }
}

export async function insertOne<T extends GenericRow = GenericRow>(
  table: string,
  data: Record<string, unknown>,
  options?: MutationOptions
): Promise<T> {
  const supabase = getClient()
  const result = await supabase
    .from(table)
    .insert(data)
    .select(options?.select ?? '*')
    .single()

  if (result.error) {
    throw new DatabaseError(String(result.error), { cause: result.error as Error })
  }

  invalidateTableCache(table, options)
  return result.data as unknown as T
}

export async function insertMany<T extends GenericRow = GenericRow>(
  table: string,
  data: Record<string, unknown>[],
  options?: MutationOptions
): Promise<T[]> {
  const supabase = getClient()
  const result = await supabase
    .from(table)
    .insert(data)
    .select(options?.select ?? '*')

  if (result.error) {
    throw new DatabaseError(String(result.error), { cause: result.error as Error })
  }

  invalidateTableCache(table, options)
  return result.data as unknown as T[]
}

export async function updateById<T extends GenericRow = GenericRow>(
  table: string,
  id: string,
  data: Record<string, unknown>,
  options?: MutationOptions
): Promise<T> {
  const supabase = getClient()
  const result = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select(options?.select ?? '*')
    .single()

  if (result.error) {
    throw new DatabaseError(String(result.error), { cause: result.error as Error })
  }

  invalidateTableCache(table, options)
  return result.data as unknown as T
}

export async function updateWhere<T extends GenericRow = GenericRow>(
  table: string,
  conditions: Record<string, unknown>,
  data: Record<string, unknown>,
  options?: MutationOptions
): Promise<T[]> {
  const supabase = getClient()
  let query = supabase
    .from(table)
    .update(data)
    .select(options?.select ?? '*')

  Object.entries(conditions).forEach(([key, value]) => {
    query = query.eq(key, value) as any
  })

  const result = await query

  if (result.error) {
    throw new DatabaseError(String(result.error), { cause: result.error as Error })
  }

  invalidateTableCache(table, options)
  return result.data as unknown as T[]
}

export async function upsert<T extends GenericRow = GenericRow>(
  table: string,
  data: Record<string, unknown>,
  options?: MutationOptions & { onConflict?: string }
): Promise<T> {
  const supabase = getClient()
  const result = await supabase
    .from(table)
    .upsert(data, { onConflict: options?.onConflict ?? 'id' })
    .select(options?.select ?? '*')
    .single()

  if (result.error) {
    throw new DatabaseError(String(result.error), { cause: result.error as Error })
  }

  invalidateTableCache(table, options)
  return result.data as unknown as T
}

export async function deleteById(
  table: string,
  id: string,
  options?: MutationOptions
): Promise<void> {
  const supabase = getClient()
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)

  if (error) {
    throw new DatabaseError(String(error), { cause: error as Error })
  }

  invalidateTableCache(table, options)
}

export async function deleteWhere(
  table: string,
  conditions: Record<string, unknown>,
  options?: MutationOptions
): Promise<number> {
  const supabase = getClient()
  let query = supabase
    .from(table)
    .delete()

  Object.entries(conditions).forEach(([key, value]) => {
    query = query.eq(key, value) as any
  })

  const { data, error, count } = await query

  if (error) {
    throw new DatabaseError(String(error), { cause: error as Error })
  }

  invalidateTableCache(table, options)
  return count ?? 0
}

export async function deleteMany(
  table: string,
  ids: string[],
  options?: MutationOptions
): Promise<void> {
  const supabase = getClient()
  const { error } = await supabase
    .from(table)
    .delete()
    .in('id', ids)

  if (error) {
    throw new DatabaseError(String(error), { cause: error as Error })
  }

  invalidateTableCache(table, options)
}

export async function softDelete<T extends GenericRow = GenericRow>(
  table: string,
  id: string,
  options?: MutationOptions
): Promise<T> {
  const supabase = getClient()
  const result = await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select(options?.select ?? '*')
    .single()

  if (result.error) {
    throw new DatabaseError(String(result.error), { cause: result.error as Error })
  }

  invalidateTableCache(table, options)
  return result.data as unknown as T
}

export async function restore<T extends GenericRow = GenericRow>(
  table: string,
  id: string,
  options?: MutationOptions
): Promise<T> {
  const supabase = getClient()
  const result = await supabase
    .from(table)
    .update({ deleted_at: null })
    .eq('id', id)
    .select(options?.select ?? '*')
    .single()

  if (result.error) {
    throw new DatabaseError(String(result.error), { cause: result.error as Error })
  }

  invalidateTableCache(table, options)
  return result.data as unknown as T
}

export async function bulkInsert<T extends GenericRow = GenericRow>(
  table: string,
  items: Record<string, unknown>[],
  options?: MutationOptions
): Promise<T[]> {
  return insertMany<T>(table, items, options)
}

export async function bulkUpdate<T extends GenericRow = GenericRow>(
  table: string,
  items: { id: string; data: Record<string, unknown> }[],
  options?: MutationOptions
): Promise<T[]> {
  const supabase = getClient()
  const results = await Promise.all(
    items.map((item) =>
      supabase
        .from(table)
        .update(item.data)
        .eq('id', item.id)
        .select(options?.select ?? '*')
        .single()
    )
  )

  const errors = results.filter((r) => r.error)
  if (errors.length > 0) {
    throw new DatabaseError(String(errors[0].error), { cause: errors[0].error as Error })
  }

  invalidateTableCache(table, options)
  return results.map((r) => r.data as unknown as T)
}

export async function runSequential<T extends GenericRow = GenericRow>(
  table: string,
  operations: Array<() => Promise<T>>,
  options?: MutationOptions
): Promise<T[]> {
  const results: T[] = []

  for (const operation of operations) {
    const result = await operation()
    results.push(result)
  }

  invalidateTableCache(table, options)
  return results
}
