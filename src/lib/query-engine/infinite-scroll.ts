import type { QueryEngine } from './engine'
import type { Filter, SortConfig, InfiniteScrollState, InfiniteScrollOptions } from './types'

export class InfiniteScrollManager<T = unknown> {
  private engine: QueryEngine
  private options: InfiniteScrollOptions
  private state: InfiniteScrollState<T>
  private loadingController: AbortController | null = null

  constructor(engine: QueryEngine, options: InfiniteScrollOptions) {
    this.engine = engine
    this.options = options
    this.state = {
      data: [],
      loading: false,
      loadingMore: false,
      hasMore: true,
      cursor: null,
      error: null,
      totalCount: 0,
    }
  }

  getState(): InfiniteScrollState<T> {
    return { ...this.state }
  }

  async load(): Promise<InfiniteScrollState<T>> {
    if (this.state.loading) return this.state

    this.state.loading = true
    this.state.error = null

    try {
      const result = await this.engine.queryPaginatedCursor<T>({
        table: this.options.table,
        columns: this.options.columns,
        filters: this.options.filters,
        sort: this.options.sort,
        pageSize: this.options.pageSize,
        cursorColumn: this.options.cursorColumn,
        cursor: undefined,
        ttl: this.options.ttl,
        bypassCache: this.options.bypassCache,
        timeout: this.options.timeout,
        retries: this.options.retries,
      })

      this.state.data = result.data
      this.state.hasMore = result.hasMore
      this.state.cursor = result.nextCursor
      this.state.totalCount = result.totalCount
      this.state.loading = false

      return { ...this.state }
    } catch (error) {
      this.state.error = error instanceof Error ? error : new Error(String(error))
      this.state.loading = false
      return { ...this.state }
    }
  }

  async loadMore(): Promise<InfiniteScrollState<T>> {
    if (this.state.loadingMore || !this.state.hasMore) return this.state

    this.state.loadingMore = true
    this.state.error = null

    try {
      const result = await this.engine.queryPaginatedCursor<T>({
        table: this.options.table,
        columns: this.options.columns,
        filters: this.options.filters,
        sort: this.options.sort,
        pageSize: this.options.pageSize,
        cursorColumn: this.options.cursorColumn,
        cursor: this.state.cursor ?? undefined,
        ttl: this.options.ttl,
        bypassCache: this.options.bypassCache,
        timeout: this.options.timeout,
        retries: this.options.retries,
      })

      this.state.data = [...this.state.data, ...result.data]
      this.state.hasMore = result.hasMore
      this.state.cursor = result.nextCursor
      this.state.loadingMore = false

      return { ...this.state }
    } catch (error) {
      this.state.error = error instanceof Error ? error : new Error(String(error))
      this.state.loadingMore = false
      return { ...this.state }
    }
  }

  async preloadNext(): Promise<void> {
    if (!this.state.hasMore || this.state.loadingMore) return

    try {
      await this.engine.queryPaginatedCursor<T>({
        table: this.options.table,
        columns: this.options.columns,
        filters: this.options.filters,
        sort: this.options.sort,
        pageSize: this.options.pageSize,
        cursorColumn: this.options.cursorColumn,
        cursor: this.state.cursor ?? undefined,
        ttl: this.options.ttl,
        bypassCache: true,
        timeout: this.options.timeout,
        retries: this.options.retries,
      })
    } catch {
      // Silently fail preloading
    }
  }

  cancel(): void {
    if (this.loadingController) {
      this.loadingController.abort()
      this.loadingController = null
    }
  }

  reset(): InfiniteScrollState<T> {
    this.cancel()
    this.state = {
      data: [],
      loading: false,
      loadingMore: false,
      hasMore: true,
      cursor: null,
      error: null,
      totalCount: 0,
    }
    return { ...this.state }
  }

  append(item: T): void {
    this.state.data = [...this.state.data, item]
    this.state.totalCount += 1
  }

  remove(id: string): void {
    this.state.data = this.state.data.filter((item: any) => (item as any).id !== id)
    this.state.totalCount = Math.max(0, this.state.totalCount - 1)
  }

  update(id: string, data: Partial<T>): void {
    this.state.data = this.state.data.map((item: any) =>
      (item as any).id === id ? { ...(item as any), ...data } : item
    )
  }

  refresh(): Promise<InfiniteScrollState<T>> {
    this.reset()
    return this.load()
  }
}
