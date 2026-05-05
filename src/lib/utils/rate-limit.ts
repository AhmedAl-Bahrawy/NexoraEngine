import { RateLimitError } from '../errors/nexora-error'

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  message?: string
  keyGenerator?: (identifier: string) => string
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry>
  private config: RateLimitConfig
  private cleanupInterval: ReturnType<typeof setInterval> | null

  constructor(config: RateLimitConfig) {
    this.limits = new Map()
    this.config = config
    this.cleanupInterval = null
    this.startCleanup()
  }

  async check(identifier: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const key = this.config.keyGenerator?.(identifier) ?? identifier
    const now = Date.now()
    let entry = this.limits.get(key)

    if (!entry || now >= entry.resetAt) {
      entry = {
        count: 0,
        resetAt: now + this.config.windowMs,
      }
      this.limits.set(key, entry)
    }

    entry.count++

    const allowed = entry.count <= this.config.maxRequests
    const remaining = Math.max(0, this.config.maxRequests - entry.count)

    if (!allowed) {
      throw new RateLimitError(
        this.config.message ?? `Rate limit exceeded. Try again in ${Math.ceil((entry.resetAt - now) / 1000)}s`
      )
    }

    return {
      allowed,
      remaining,
      resetAt: entry.resetAt,
    }
  }

  async consume(identifier: string): Promise<boolean> {
    const result = await this.check(identifier)
    return result.allowed
  }

  reset(identifier?: string): void {
    if (identifier) {
      const key = this.config.keyGenerator?.(identifier) ?? identifier
      this.limits.delete(key)
    } else {
      this.limits.clear()
    }
  }

  getStats(): { activeKeys: number; totalRequests: number } {
    let totalRequests = 0
    for (const entry of this.limits.values()) {
      totalRequests += entry.count
    }

    return {
      activeKeys: this.limits.size,
      totalRequests,
    }
  }

  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.limits.clear()
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.limits.entries()) {
        if (now >= entry.resetAt) {
          this.limits.delete(key)
        }
      }
    }, Math.min(this.config.windowMs, 60000))
  }
}

const defaultLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
})

export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config)
}

export async function rateLimit(identifier: string, config?: RateLimitConfig): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const limiter = config ? new RateLimiter(config) : defaultLimiter
  return limiter.check(identifier)
}
