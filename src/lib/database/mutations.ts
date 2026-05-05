import { getSupabaseClient } from '../auth/client'
import { handleSupabaseError } from '../utils/errors'
import { withRetry } from '../utils/retry'
import { validateInput, type AnyZodSchema } from '../utils/validate'
import { QueryCache, CacheKey } from '../cache'
import { DATABASE } from '../constants/supabase'

export interface MutationOptions {
  select?: string
  timeout?: number
  retries?: number
  retryDelay?: number
  invalidateCache?: boolean
  validate?: AnyZodSchema
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
    cache.invalidatePattern(CacheKey.tablePrefix(table))
  }
}

async function executeQuery(query: any, options?: { timeout?: number; retries?: number; retryDelay?: number }): Promise<any> {
  const timeoutMs = options?.timeout ?? DATABASE.DEFAULT_TIMEOUT

  const execute = async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const result = await query
      if (result.error) {
        throw handleSupabaseError(result.error)
      }
      return result
    } finally {
      clearTimeout(timeoutId)
    }
  }

  const retries = options?.retries ?? 0
  const retryDelay = options?.retryDelay ?? DATABASE.RETRY_DELAY

  return withRetry(execute, { retries, delay: retryDelay })
}

export async function insertOne<T>(
  table: string,
  data: Record<string, unknown>,
  options?: MutationOptions
): Promise<T> {
  if (options?.validate) {
    const result = validateInput(data, options.validate)
    if (!result.valid) {
      throw handleSupabaseError(new Error(`Validation failed: ${result.errors.join(', ')}`))
    }
  }

  const supabase = getSupabaseClient()
  const result = await executeQuery(
    (supabase.from(table) as any).insert(data).select(options?.select ?? '*').single(),
    { timeout: options?.timeout, retries: options?.retries, retryDelay: options?.retryDelay }
  )

  invalidateTableCache(table, options)
  return result.data as T
}

export async function insertMany<T>(
  table: string,
  data: Record<string, unknown>[],
  options?: MutationOptions
): Promise<T[]> {
  const supabase = getSupabaseClient()
  const result = await executeQuery(
    (supabase.from(table) as any).insert(data).select(options?.select ?? '*'),
    { timeout: options?.timeout, retries: options?.retries, retryDelay: options?.retryDelay }
  )

  invalidateTableCache(table, options)
  return result.data as T[]
}

export async function updateById<T>(
  table: string,
  id: string,
  data: Record<string, unknown>,
  options?: MutationOptions
): Promise<T> {
  if (options?.validate) {
    const result = validateInput(data, options.validate)
    if (!result.valid) {
      throw handleSupabaseError(new Error(`Validation failed: ${result.errors.join(', ')}`))
    }
  }

  const supabase = getSupabaseClient()
  const result = await executeQuery(
    (supabase.from(table) as any).update(data).eq('id', id).select(options?.select ?? '*').single(),
    { timeout: options?.timeout, retries: options?.retries, retryDelay: options?.retryDelay }
  )

  invalidateTableCache(table, options)
  return result.data as T
}

export async function updateWhere<T>(
  table: string,
  conditions: Record<string, unknown>,
  data: Record<string, unknown>,
  options?: MutationOptions
): Promise<T[]> {
  if (options?.validate) {
    const result = validateInput(data, options.validate)
    if (!result.valid) {
      throw handleSupabaseError(new Error(`Validation failed: ${result.errors.join(', ')}`))
    }
  }

  const supabase = getSupabaseClient()
  let query = (supabase.from(table) as any).update(data).select(options?.select ?? '*')

  Object.entries(conditions).forEach(([key, value]) => {
    query = (query as any).eq(key, value)
  })

  const result = await executeQuery(query, { timeout: options?.timeout, retries: options?.retries, retryDelay: options?.retryDelay })

  invalidateTableCache(table, options)
  return result.data as T[]
}

export async function upsert<T>(
  table: string,
  data: Record<string, unknown>,
  options?: MutationOptions & { onConflict?: string }
): Promise<T> {
  if (options?.validate) {
    const result = validateInput(data, options.validate)
    if (!result.valid) {
      throw handleSupabaseError(new Error(`Validation failed: ${result.errors.join(', ')}`))
    }
  }

  const supabase = getSupabaseClient()
  const result = await executeQuery(
    (supabase.from(table) as any)
      .upsert(data, { onConflict: options?.onConflict ?? 'id' })
      .select(options?.select ?? '*')
      .single(),
    { timeout: options?.timeout, retries: options?.retries, retryDelay: options?.retryDelay }
  )

  invalidateTableCache(table, options)
  return result.data as T
}

export async function deleteById(
  table: string,
  id: string,
  options?: MutationOptions
): Promise<void> {
  const supabase = getSupabaseClient()
  await executeQuery(
    (supabase.from(table) as any).delete().eq('id', id),
    { timeout: options?.timeout, retries: options?.retries, retryDelay: options?.retryDelay }
  )

  invalidateTableCache(table, options)
}

export async function deleteWhere(
  table: string,
  conditions: Record<string, unknown>,
  options?: MutationOptions
): Promise<number> {
  const supabase = getSupabaseClient()
  let query = (supabase.from(table) as any).delete()

  Object.entries(conditions).forEach(([key, value]) => {
    query = (query as any).eq(key, value)
  })

  const result = await executeQuery(query)

  invalidateTableCache(table, options)
  return result.count ?? 0
}

export async function deleteMany(
  table: string,
  ids: string[],
  options?: MutationOptions
): Promise<void> {
  const supabase = getSupabaseClient()
  await executeQuery(
    (supabase.from(table) as any).delete().in('id', ids),
    { timeout: options?.timeout, retries: options?.retries, retryDelay: options?.retryDelay }
  )

  invalidateTableCache(table, options)
}

export async function softDelete<T>(
  table: string,
  id: string,
  options?: MutationOptions
): Promise<T> {
  const supabase = getSupabaseClient()
  const result = await executeQuery(
    (supabase.from(table) as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select(options?.select ?? '*')
      .single(),
    { timeout: options?.timeout, retries: options?.retries, retryDelay: options?.retryDelay }
  )

  invalidateTableCache(table, options)
  return result.data as T
}

export async function restore<T>(
  table: string,
  id: string,
  options?: MutationOptions
): Promise<T> {
  const supabase = getSupabaseClient()
  const result = await executeQuery(
    (supabase.from(table) as any)
      .update({ deleted_at: null })
      .eq('id', id)
      .select(options?.select ?? '*')
      .single(),
    { timeout: options?.timeout, retries: options?.retries, retryDelay: options?.retryDelay }
  )

  invalidateTableCache(table, options)
  return result.data as T
}

export async function bulkInsert<T>(
  table: string,
  items: Record<string, unknown>[],
  options?: MutationOptions
): Promise<T[]> {
  const supabase = getSupabaseClient()
  const result = await executeQuery(
    (supabase.from(table) as any).insert(items).select(options?.select ?? '*'),
    { timeout: options?.timeout, retries: options?.retries, retryDelay: options?.retryDelay }
  )

  invalidateTableCache(table, options)
  return result.data as T[]
}

export async function bulkUpdate<T>(
  table: string,
  items: { id: string; data: Record<string, unknown> }[],
  options?: MutationOptions
): Promise<T[]> {
  const supabase = getSupabaseClient()
  const results = await Promise.all(
    items.map((item) =>
      (supabase.from(table) as any)
        .update(item.data)
        .eq('id', item.id)
        .select(options?.select ?? '*')
        .single()
    )
  )

  const errors = results.filter((r: any) => r.error).map((r: any) => r.error)
  if (errors.length > 0) {
    throw handleSupabaseError(errors[0])
  }

  invalidateTableCache(table, options)
  return results.map((r: any) => r.data) as T[]
}

export async function runSequential<T>(
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
