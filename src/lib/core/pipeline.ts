import { NexoraError } from '../errors/nexora-error'

export interface RequestOptions {
  timeout?: number
  retries?: number
  retryDelay?: number
  signal?: AbortSignal
}

export async function executeRequest<T>(
  operation: (signal?: AbortSignal) => Promise<T>,
  options: RequestOptions = {}
): Promise<T> {
  const { timeout = 30_000, retries = 3, retryDelay = 1_000, signal } = options

  let lastError: unknown

  for (let i = 0; i < Math.max(1, retries); i++) {
    const controller = new AbortController()
    const combinedSignal = combineSignals(signal, controller.signal)

    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const result = await operation(combinedSignal)
      clearTimeout(timeoutId)
      return result
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error

      if (i < retries - 1 && isRetryableError(error)) {
        await sleep(retryDelay * Math.pow(2, i))
        continue
      }
      break
    }
  }

  throw enhanceError(lastError)
}

function combineSignals(...signals: (AbortSignal | undefined)[]): AbortSignal {
  const filtered = signals.filter((s): s is AbortSignal => s !== undefined)
  if (filtered.length === 0) return new AbortController().signal
  if (filtered.length === 1) return filtered[0]

  const controller = new AbortController()
  for (const signal of filtered) {
    if (signal.aborted) {
      controller.abort(signal.reason)
      break
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true })
  }
  return controller.signal
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
