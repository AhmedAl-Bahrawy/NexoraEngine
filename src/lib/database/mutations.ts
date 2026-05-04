/**
 * Database Mutations
 * Insert, update, and delete operations
 */

import { supabase } from './client'
import { handleSupabaseError } from '../utils/errors'

// Types
export interface BulkInsertItem<T> {
  data: T
}

export interface BulkUpdateItem<T> {
  id: string
  data: Partial<T>
}

// Insert single record
export async function insertOne<T>(
  table: string,
  data: any
): Promise<T> {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data as any)
    .select()
    .single()

  if (error) throw handleSupabaseError(error)
  return result as T
}

// Insert multiple records
export async function insertMany<T>(
  table: string,
  data: any[]
): Promise<T[]> {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data as any)
    .select()

  if (error) throw handleSupabaseError(error)
  return result as T[]
}

// Update single record by ID
export async function updateById<T>(
  table: string,
  id: string,
  data: any
): Promise<T> {
  const { data: result, error } = await supabase
    .from(table)
    .update(data as any)
    .eq('id', id)
    .select()
    .single()

  if (error) throw handleSupabaseError(error)
  return result as T
}

// Update records with custom conditions
export async function updateWhere<T>(
  table: string,
  conditions: Record<string, unknown>,
  data: any
): Promise<T[]> {
  let query = supabase.from(table).update(data as any)

  Object.entries(conditions).forEach(([key, value]) => {
    query = query.eq(key, value)
  })

  const { data: result, error } = await query.select()

  if (error) throw handleSupabaseError(error)
  return result as T[]
}

// Upsert (insert or update)
export async function upsert<T>(
  table: string,
  data: any,
  options?: { onConflict?: string }
): Promise<T> {
  const { data: result, error } = await supabase
    .from(table)
    .upsert(data as any, {
      onConflict: options?.onConflict || 'id',
    })
    .select()
    .single()

  if (error) throw handleSupabaseError(error)
  return result as T
}

// Delete single record by ID
export async function deleteById(
  table: string,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)

  if (error) throw handleSupabaseError(error)
}

// Delete records with custom conditions
export async function deleteWhere(
  table: string,
  conditions: Record<string, unknown>
): Promise<number> {
  let query = supabase.from(table).delete()

  Object.entries(conditions).forEach(([key, value]) => {
    query = query.eq(key, value)
  })

  const { error, count } = await query

  if (error) throw handleSupabaseError(error)
  return count || 0
}

// Bulk delete by IDs
export async function deleteMany(
  table: string,
  ids: string[]
): Promise<void> {
  const { error } = await supabase
    .from(table)
    .delete()
    .in('id', ids)

  if (error) throw handleSupabaseError(error)
}

// Soft delete (requires 'deleted_at' column)
export async function softDelete<T>(
  table: string,
  id: string
): Promise<T> {
  const { data: result, error } = await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() } as any)
    .eq('id', id)
    .select()
    .single()

  if (error) throw handleSupabaseError(error)
  return result as T
}

// Restore soft-deleted record
export async function restore<T>(
  table: string,
  id: string
): Promise<T> {
  const { data: result, error } = await supabase
    .from(table)
    .update({ deleted_at: null } as any)
    .eq('id', id)
    .select()
    .single()

  if (error) throw handleSupabaseError(error)
  return result as T
}

// Bulk insert
export async function bulkInsert<T>(
  table: string,
  items: any[]
): Promise<T[]> {
  const { data: result, error } = await supabase
    .from(table)
    .insert(items as any)
    .select()

  if (error) throw handleSupabaseError(error)
  return result as T[]
}

// Bulk update
export async function bulkUpdate<T>(
  table: string,
  items: { id: string; data: any }[]
): Promise<T[]> {
  const results = await Promise.all(
    items.map((item) =>
      supabase
        .from(table)
        .update(item.data as any)
        .eq('id', item.id)
        .select()
        .single()
    )
  )

  const errors = results.filter((r) => r.error).map((r) => r.error)
  if (errors.length > 0) {
    throw handleSupabaseError(errors[0]!)
  }

  return results.map((r) => r.data) as T[]
}

// Transaction-like batch operations
export async function transaction<T>(
  operations: Array<() => Promise<T>>
): Promise<T[]> {
  const results: T[] = []
  const errors: Error[] = []

  for (const operation of operations) {
    try {
      const result = await operation()
      results.push(result)
    } catch (err) {
      errors.push(handleSupabaseError(err))
    }
  }

  if (errors.length > 0) {
    throw errors[0]
  }

  return results
}
