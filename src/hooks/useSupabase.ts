import { useState, useEffect, useCallback, useRef } from 'react'
import {
  supabase,
  fetchFromTable,
  insertIntoTable,
  updateTable,
  deleteFromTable,
  subscribeToTable,
  handleSupabaseError,
  type SupabaseClient,
  type DbRow,
  type RealtimeChange,
} from '../lib/supabase'

// Hook to access the Supabase client directly
export function useSupabase(): SupabaseClient {
  return supabase
}

// Generic data fetching hook
export function useFetch<T>(
  table: string,
  options?: {
    columns?: string
    filter?: (query: any) => any
    order?: { column: string; ascending?: boolean }
    limit?: number
    enabled?: boolean
  }
) {
  const [data, setData] = useState<T[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    if (options?.enabled === false) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await fetchFromTable<T>(table, options)
      setData(result as T[])
    } catch (err) {
      setError(handleSupabaseError(err))
    } finally {
      setLoading(false)
    }
  }, [table, JSON.stringify(options)])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData, setData }
}

// Hook for single record fetching
export function useFetchOne<T>(
  table: string,
  match: Record<string, unknown>,
  options?: {
    columns?: string
    enabled?: boolean
  }
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    if (options?.enabled === false) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const filter = (query: any) => {
        Object.entries(match).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
        return query
      }

      const result = await fetchFromTable<T>(table, {
        ...options,
        filter,
        single: true,
      })
      setData(result as T)
    } catch (err) {
      setError(handleSupabaseError(err))
    } finally {
      setLoading(false)
    }
  }, [table, JSON.stringify(match), JSON.stringify(options)])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData, setData }
}

// Hook for insert operations
export function useInsert<T>(table: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const insert = useCallback(
    async (data: Partial<T> | Partial<T>[]) => {
      setLoading(true)
      setError(null)

      try {
        const result = await insertIntoTable<T>(table, data)
        setLoading(false)
        return result
      } catch (err) {
        const error = handleSupabaseError(err)
        setError(error)
        setLoading(false)
        throw error
      }
    },
    [table]
  )

  return { insert, loading, error }
}

// Hook for update operations
export function useUpdate<T>(table: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = useCallback(
    async (data: Partial<T>, match: Record<string, unknown>) => {
      setLoading(true)
      setError(null)

      try {
        const result = await updateTable<T>(table, data, match)
        setLoading(false)
        return result
      } catch (err) {
        const error = handleSupabaseError(err)
        setError(error)
        setLoading(false)
        throw error
      }
    },
    [table]
  )

  const updateById = useCallback(
    async (id: string, data: Partial<T>) => {
      return update(data, { id })
    },
    [update]
  )

  return { update, updateById, loading, error }
}

// Hook for delete operations
export function useDelete(table: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const remove = useCallback(
    async (match: Record<string, unknown>) => {
      setLoading(true)
      setError(null)

      try {
        await deleteFromTable(table, match)
        setLoading(false)
      } catch (err) {
        const error = handleSupabaseError(err)
        setError(error)
        setLoading(false)
        throw error
      }
    },
    [table]
  )

  const removeById = useCallback(
    async (id: string) => {
      return remove({ id })
    },
    [remove]
  )

  return { remove, removeById, loading, error }
}

// Hook for realtime subscriptions
export function useRealtime<T>(
  table: string,
  callback: (change: RealtimeChange<T>) => void,
  filter?: { event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'; filter?: string }
) {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const callbackRef = useRef(callback)

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    setError(null)

    const subscription = subscribeToTable<T>(
      table,
      (change) => {
        callbackRef.current(change)
      },
      filter
    )

    // Set connected after a short delay to allow subscription to establish
    const timeout = setTimeout(() => {
      setConnected(true)
    }, 1000)

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
      setConnected(false)
    }
  }, [table, JSON.stringify(filter)])

  return { connected, error }
}

// Hook that combines fetch + realtime for live data
export function useLiveQuery<T extends DbRow<unknown>>(
  table: string,
  options?: {
    columns?: string
    filter?: (query: any) => any
    order?: { column: string; ascending?: boolean }
    limit?: number
    enabled?: boolean
  }
) {
  const { data, loading, error, refetch, setData } = useFetch<T>(
    table,
    options
  )

  useRealtime<T>(
    table,
    (change) => {
      if (!data) return

      switch (change.eventType) {
        case 'INSERT':
          if (change.new) {
            setData([change.new, ...data])
          }
          break
        case 'UPDATE':
          setData(
            data.map((item) =>
              item.id === change.new?.id ? (change.new as T) : item
            )
          )
          break
        case 'DELETE':
          setData(data.filter((item) => item.id !== change.old?.id))
          break
      }
    },
    { event: '*' }
  )

  return { data, loading, error, refetch }
}

// Hook for paginated queries
export function usePagination<T>(
  table: string,
  options: {
    columns?: string
    filter?: (query: any) => any
    order?: { column: string; ascending?: boolean }
    pageSize?: number
  } = {}
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const pageSize = options.pageSize || 10

  const fetchPage = useCallback(
    async (pageNum: number, append = false) => {
      setLoading(true)
      setError(null)

      try {
        const from = (pageNum - 1) * pageSize
        const to = from + pageSize - 1

        let query = supabase
          .from(table)
          .select(options.columns || '*', { count: 'exact' })

        if (options.filter) {
          query = options.filter(query)
        }

        if (options.order) {
          query = query.order(options.order.column, {
            ascending: options.order.ascending ?? true,
          })
        }

        const { data: result, error: queryError, count } = await query.range(
          from,
          to
        )

        if (queryError) throw handleSupabaseError(queryError)

        setData((prev) => (append ? [...prev, ...(result as T[])] : (result as T[])))
        setTotalCount(count || 0)
        setHasMore((count || 0) > to + 1)
        setPage(pageNum)
      } catch (err) {
        setError(handleSupabaseError(err))
      } finally {
        setLoading(false)
      }
    },
    [table, JSON.stringify(options), pageSize]
  )

  const nextPage = useCallback(() => {
    if (!loading && hasMore) {
      fetchPage(page + 1, true)
    }
  }, [fetchPage, page, loading, hasMore])

  const prevPage = useCallback(() => {
    if (page > 1) {
      fetchPage(page - 1)
    }
  }, [fetchPage, page])

  const goToPage = useCallback(
    (pageNum: number) => {
      fetchPage(pageNum)
    },
    [fetchPage]
  )

  const refresh = useCallback(() => {
    fetchPage(1)
  }, [fetchPage])

  useEffect(() => {
    fetchPage(1)
  }, [fetchPage])

  const totalPages = Math.ceil(totalCount / pageSize)

  return {
    data,
    loading,
    error,
    page,
    pageSize,
    totalPages,
    totalCount,
    hasMore,
    hasPrev: page > 1,
    nextPage,
    prevPage,
    goToPage,
    refresh,
  }
}

// Hook for optimistic updates
export function useOptimisticUpdate<T extends DbRow<unknown>>(
  _table: string,
  initialData: T[] = []
) {
  const [data, setData] = useState<T[]>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const optimisticInsert = useCallback(
    async (newItem: Partial<T>, serverInsert: () => Promise<T>) => {
      // Generate temporary ID
      const tempId = `temp-${Date.now()}`
      const optimisticItem = { ...newItem, id: tempId } as T

      // Optimistically add to UI
      setData((prev) => [optimisticItem, ...prev])

      try {
        setLoading(true)
        const result = await serverInsert()

        // Replace temp item with real one
        setData((prev) =>
          prev.map((item) => (item.id === tempId ? result : item))
        )

        return result
      } catch (err) {
        // Rollback on error
        setData((prev) => prev.filter((item) => item.id !== tempId))
        const error = handleSupabaseError(err)
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const optimisticUpdate = useCallback(
    async (id: string, updates: Partial<T>, serverUpdate: () => Promise<T>) => {
      const previousItem = data.find((item) => item.id === id)
      if (!previousItem) return

      // Optimistically update UI
      setData((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } as T : item))
      )

      try {
        setLoading(true)
        const result = await serverUpdate()

        // Confirm with server result
        setData((prev) =>
          prev.map((item) => (item.id === id ? result : item))
        )

        return result
      } catch (err) {
        // Rollback on error
        setData((prev) =>
          prev.map((item) => (item.id === id ? previousItem : item))
        )
        const error = handleSupabaseError(err)
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [data]
  )

  const optimisticDelete = useCallback(
    async (id: string, serverDelete: () => Promise<void>) => {
      const previousItem = data.find((item) => item.id === id)
      if (!previousItem) return

      // Optimistically remove from UI
      setData((prev) => prev.filter((item) => item.id !== id))

      try {
        setLoading(true)
        await serverDelete()
      } catch (err) {
        // Rollback on error
        setData((prev) => [previousItem, ...prev])
        const error = handleSupabaseError(err)
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [data]
  )

  return {
    data,
    setData,
    loading,
    error,
    optimisticInsert,
    optimisticUpdate,
    optimisticDelete,
  }
}

// Hook for storage operations
export function useStorage(bucket: string) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const upload = useCallback(
    async (path: string, file: File) => {
      setUploading(true)
      setError(null)

      try {
        const { data, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file, {
            upsert: true,
          })

        if (uploadError) throw handleSupabaseError(uploadError)

        return data
      } catch (err) {
        const error = handleSupabaseError(err)
        setError(error)
        throw error
      } finally {
        setUploading(false)
      }
    },
    [bucket]
  )

  const getPublicUrl = useCallback(
    (path: string) => {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      return data.publicUrl
    },
    [bucket]
  )

  const remove = useCallback(
    async (paths: string[]) => {
      setError(null)

      try {
        const { error: deleteError } = await supabase.storage
          .from(bucket)
          .remove(paths)

        if (deleteError) throw handleSupabaseError(deleteError)
      } catch (err) {
        const error = handleSupabaseError(err)
        setError(error)
        throw error
      }
    },
    [bucket]
  )

  const list = useCallback(
    async (path?: string) => {
      setError(null)

      try {
        const { data, error: listError } = await supabase.storage
          .from(bucket)
          .list(path || '')

        if (listError) throw handleSupabaseError(listError)
        return data
      } catch (err) {
        const error = handleSupabaseError(err)
        setError(error)
        throw error
      }
    },
    [bucket]
  )

  return {
    upload,
    getPublicUrl,
    remove,
    list,
    uploading,
    error,
  }
}

// Hook for RPC (Remote Procedure Calls)
export function useRpc<T = unknown>(functionName: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(
    async (params?: Record<string, unknown>) => {
      setLoading(true)
      setError(null)

      try {
        const { data: result, error: rpcError } = await supabase.rpc(
          functionName,
          params
        )

        if (rpcError) throw handleSupabaseError(rpcError)

        setData(result as T)
        return result as T
      } catch (err) {
        const error = handleSupabaseError(err)
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [functionName]
  )

  return { execute, data, loading, error }
}

// Hook for batch operations
export function useBatch<T>(table: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const batchInsert = useCallback(
    async (items: Partial<T>[]) => {
      setLoading(true)
      setError(null)

      try {
        const { data, error: batchError } = await supabase
          .from(table)
          .insert(items)
          .select()

        if (batchError) throw handleSupabaseError(batchError)
        return data as T[]
      } catch (err) {
        const error = handleSupabaseError(err)
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [table]
  )

  const batchUpdate = useCallback(
    async (items: { id: string; data: any }[]) => {
      setLoading(true)
      setError(null)

      try {
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
      } catch (err) {
        const error = handleSupabaseError(err)
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [table]
  )

  const batchDelete = useCallback(
    async (ids: string[]) => {
      setLoading(true)
      setError(null)

      try {
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .in('id', ids)

        if (deleteError) throw handleSupabaseError(deleteError)
      } catch (err) {
        const error = handleSupabaseError(err)
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [table]
  )

  return { batchInsert, batchUpdate, batchDelete, loading, error }
}

// Hook for search with debouncing
export function useSearch<T>(
  table: string,
  searchColumn: string,
  options?: {
    columns?: string
    limit?: number
    debounceMs?: number
  }
) {
  const [query, setQuery] = useState('')
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const debounceMs = options?.debounceMs || 300

  useEffect(() => {
    if (!query.trim()) {
      setData([])
      return
    }

    const timeout = setTimeout(async () => {
      setLoading(true)
      setError(null)

      try {
        const { data: result, error: searchError } = await supabase
          .from(table)
          .select(options?.columns || '*')
          .ilike(searchColumn, `%${query}%`)
          .limit(options?.limit || 20)

        if (searchError) throw handleSupabaseError(searchError)
        setData(result as T[])
      } catch (err) {
        setError(handleSupabaseError(err))
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => clearTimeout(timeout)
  }, [query, table, searchColumn, JSON.stringify(options), debounceMs])

  return { query, setQuery, data, loading, error }
}

// Hook for raw SQL queries (requires appropriate permissions)
export function useRawQuery<T>() {
  const [data, setData] = useState<T[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async (sql: string) => {
    setLoading(true)
    setError(null)

    try {
      // Note: This requires enabling the pg_exec extension in Supabase
      const { data: result, error: queryError } = await supabase.rpc('exec_sql', {
        query: sql,
      })

      if (queryError) throw handleSupabaseError(queryError)
      setData(result as T[])
      return result as T[]
    } catch (err) {
      const error = handleSupabaseError(err)
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return { execute, data, loading, error }
}

// Hook for count queries
export function useCount(
  table: string,
  options?: {
    filter?: (query: any) => any
    head?: boolean
  }
) {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchCount = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase.from(table).select('*', {
        count: 'exact',
        head: options?.head ?? true,
      })

      if (options?.filter) {
        query = options.filter(query)
      }

      const { count: result, error: countError } = await query

      if (countError) throw handleSupabaseError(countError)
      setCount(result || 0)
    } catch (err) {
      setError(handleSupabaseError(err))
    } finally {
      setLoading(false)
    }
  }, [table, JSON.stringify(options)])

  useEffect(() => {
    fetchCount()
  }, [fetchCount])

  return { count, loading, error, refetch: fetchCount }
}

// Hook for aggregation queries
export function useAggregate<T = unknown>(
  table: string,
  aggregation: {
    column: string
    operation: 'avg' | 'count' | 'max' | 'min' | 'sum'
  },
  options?: {
    filter?: (query: any) => any
    groupBy?: string
  }
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchAggregate = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Note: This uses RPC with a custom function for aggregations
      const { data: result, error: aggregateError } = await supabase.rpc(
        'aggregate_table',
        {
          p_table: table,
          p_column: aggregation.column,
          p_operation: aggregation.operation,
          p_group_by: options?.groupBy,
        }
      )

      if (aggregateError) throw handleSupabaseError(aggregateError)
      setData(result as T)
    } catch (err) {
      setError(handleSupabaseError(err))
    } finally {
      setLoading(false)
    }
  }, [table, JSON.stringify(aggregation), JSON.stringify(options)])

  useEffect(() => {
    fetchAggregate()
  }, [fetchAggregate])

  return { data, loading, error, refetch: fetchAggregate }
}

// Hook for complex joins (requires proper view setup or RPC)
export function useJoin<T>(
  primaryTable: string,
  joins: Array<{
    table: string
    on: string
    columns?: string
    type?: 'inner' | 'left' | 'right'
  }>,
  options?: {
    columns?: string
    filter?: (query: any) => any
  }
) {
  const [data, setData] = useState<T[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchJoin = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Build select query with joins
      // Note: This is a simplified version. Complex joins often require custom views or RPC
      let selectQuery = options?.columns || '*'
      
      joins.forEach((join) => {
        const joinColumns = join.columns || '*'
        selectQuery += `, ${join.table}!${join.on}(${joinColumns})`
      })

      let query = supabase.from(primaryTable).select(selectQuery)

      if (options?.filter) {
        query = options.filter(query)
      }

      const { data: result, error: joinError } = await query

      if (joinError) throw handleSupabaseError(joinError)
      setData(result as T[])
    } catch (err) {
      setError(handleSupabaseError(err))
    } finally {
      setLoading(false)
    }
  }, [primaryTable, JSON.stringify(joins), JSON.stringify(options)])

  useEffect(() => {
    fetchJoin()
  }, [fetchJoin])

  return { data, loading, error, refetch: fetchJoin }
}

// Default export combining all hooks
export default {
  useSupabase,
  useFetch,
  useFetchOne,
  useInsert,
  useUpdate,
  useDelete,
  useRealtime,
  useLiveQuery,
  usePagination,
  useOptimisticUpdate,
  useStorage,
  useRpc,
  useBatch,
  useSearch,
  useRawQuery,
  useCount,
  useAggregate,
  useJoin,
}
