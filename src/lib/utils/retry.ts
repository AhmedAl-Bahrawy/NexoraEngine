import { DATABASE } from '../constants/supabase'

export interface RetryOptions {
  retries?: number
  delay?: number
  backoff?: 'linear' | 'exponential' | 'fixed'
  shouldRetry?: (error: Error, attempt: number) => boolean
}

function calculateDelay(attempt: number, baseDelay: number, backoff: 'linear' | 'exponential' | 'fixed'): number {
  switch (backoff) {
    case 'linear':
      return baseDelay * attempt
    case 'exponential':
      return baseDelay * Math.pow(2, attempt - 1)
    case 'fixed':
    default:
      return baseDelay
  }
}

function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase()
  const retryablePatterns = [
    'network',
    'timeout',
    'econnreset',
    'econnrefused',
    'eai_again',
    'rate limit',
    '429',
    '500',
    '502',
    '503',
    '504',
  ]

  return retryablePatterns.some(pattern => message.includes(pattern))
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const maxRetries = options?.retries ?? DATABASE.DEFAULT_RETRIES
  const baseDelay = options?.delay ?? DATABASE.RETRY_DELAY
  const backoff = options?.backoff ?? 'exponential'
  const shouldRetry = options?.shouldRetry ?? isRetryableError

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt > maxRetries || !shouldRetry(lastError, attempt)) {
        throw lastError
      }

      const delay = calculateDelay(attempt, baseDelay, backoff)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError ?? new Error('Retry failed')
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message?: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(
      () => reject(new Error(message ?? `Operation timed out after ${timeoutMs}ms`)),
      timeoutMs
    )

    promise
      .then(value => {
        clearTimeout(timeoutId)
        resolve(value)
      })
      .catch(error => {
        clearTimeout(timeoutId)
        reject(error)
      })
  })
}
