import { NexoraError } from '../errors/nexora-error'

export interface RetryOptions {
  attempts: number
  delay: number
  backoff: 'linear' | 'exponential'
  shouldRetry?: (error: unknown, attempt: number) => boolean
}

export async function withRetry<T>(
  fn: (attemptSignal?: AbortSignal) => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { attempts, delay, backoff, shouldRetry } = options

  let lastError: unknown

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const isLastAttempt = i === attempts - 1

      if (isLastAttempt) break

      const should = shouldRetry
        ? shouldRetry(error, i + 1)
        : isRetryableError(error)

      if (!should) break

      const waitTime = backoff === 'exponential'
        ? delay * Math.pow(2, i)
        : delay * (i + 1)

      await sleep(waitTime)
    }
  }

  throw enhanceError(lastError)
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    return msg.includes('network') ||
      msg.includes('timeout') ||
      msg.includes('econnrefused') ||
      msg.includes('econnreset') ||
      msg.includes('etimedout') ||
      (error as any)?.status >= 500
  }
  return false
}

function enhanceError(error: unknown): NexoraError {
  if (error instanceof NexoraError) return error

  if (error instanceof Error) {
    return new NexoraError(
      error.message,
      'execution_error',
      { cause: error }
    )
  }

  return new NexoraError(
    'An unknown error occurred during execution',
    'execution_error',
    { cause: new Error(String(error)) }
  )
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
