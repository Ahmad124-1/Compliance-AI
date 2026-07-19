export interface RetryOptions {
  retries?: number;
  delayMs?: number;
  factor?: number;
  signal?: AbortSignal;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

/**
 * Retry an async function with exponential backoff. Used for uploads,
 * network requests, and other transient failures.
 */
export async function withRetry<T>(fn: (attempt: number) => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { retries = 3, delayMs = 400, factor = 2, signal, shouldRetry } = options;
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      if (shouldRetry && !shouldRetry(err, attempt)) break;
      if (attempt === retries) break;
      const wait = delayMs * Math.pow(factor, attempt);
      await new Promise((resolve) => setTimeout(resolve, wait));
      attempt += 1;
    }
  }
  throw lastError;
}

/**
 * Wraps a promise-returning function so callers can await with a timeout.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out')), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}
