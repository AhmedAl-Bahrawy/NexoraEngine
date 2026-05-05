export interface CacheEntry<T> {
  data: T
  createdAt: number
  expiresAt: number
  hits: number
}

export interface CacheOptions {
  defaultTTL?: number
  maxEntries?: number
}

export interface CacheStats {
  size: number
  hits: number
  misses: number
  hitRate: number
}

export class QueryCache {
  private store: Map<string, CacheEntry<unknown>>
  private defaultTTL: number
  private maxEntries: number
  private totalHits: number
  private totalMisses: number

  constructor(options: CacheOptions = {}) {
    this.store = new Map()
    this.defaultTTL = options.defaultTTL ?? 5 * 60 * 1000
    this.maxEntries = options.maxEntries ?? 500
    this.totalHits = 0
    this.totalMisses = 0
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key)

    if (!entry) {
      this.totalMisses++
      return null
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      this.totalMisses++
      return null
    }

    entry.hits++
    this.totalHits++
    return entry.data as T
  }

  set<T>(key: string, data: T, ttl?: number): void {
    this.evictIfNeeded()

    this.store.set(key, {
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + (ttl ?? this.defaultTTL),
      hits: 0,
    })
  }

  invalidate(key: string): boolean {
    return this.store.delete(key)
  }

  invalidatePattern(pattern: string | RegExp): number {
    let count = 0
    for (const key of this.store.keys()) {
      if (typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key)) {
        this.store.delete(key)
        count++
      }
    }
    return count
  }

  invalidateAll(): void {
    this.store.clear()
  }

  clear(): void {
    this.invalidateAll()
    this.totalHits = 0
    this.totalMisses = 0
  }

  has(key: string): boolean {
    const entry = this.store.get(key)
    if (!entry) return false
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return false
    }
    return true
  }

  getStats(): CacheStats {
    const total = this.totalHits + this.totalMisses
    return {
      size: this.store.size,
      hits: this.totalHits,
      misses: this.totalMisses,
      hitRate: total > 0 ? this.totalHits / total : 0,
    }
  }

  keys(): string[] {
    const now = Date.now()
    const validKeys: string[] = []
    for (const [key, entry] of this.store.entries()) {
      if (now <= entry.expiresAt) {
        validKeys.push(key)
      } else {
        this.store.delete(key)
      }
    }
    return validKeys
  }

  private evictIfNeeded(): void {
    if (this.store.size < this.maxEntries) return

    const entries = Array.from(this.store.entries())
    entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt)

    const toRemove = entries.slice(0, Math.ceil(this.maxEntries * 0.2))
    for (const [key] of toRemove) {
      this.store.delete(key)
    }
  }
}
