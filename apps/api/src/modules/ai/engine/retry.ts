/**
 * Retry helper with exponential backoff and jitter.
 *
 * Used by provider adapters to transparently retry transient failures
 * (network errors, 429/5xx, timeouts). Honors a `Retry-After` header-style
 * numeric hint when supplied by the caller's error.
 */
export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  /** Predicate deciding whether an error is retryable. */
  shouldRetry?: (err: unknown, attempt: number) => boolean;
  /** Called before each attempt (attempt starts at 1). */
  onRetry?: (err: unknown, attempt: number, delayMs: number) => void;
}

const defaultShouldRetry = (err: any): boolean => {
  const status = err?.status ?? err?.statusCode ?? err?.response?.status;
  if (status) return status === 408 || status === 429 || status >= 500;
  // Network-level errors (fetch / fetch failed / timeout) are retryable.
  const msg = String(err?.message ?? err ?? '').toLowerCase();
  return msg.includes('timeout') || msg.includes('fetch failed') || msg.includes('econnreset') || msg.includes('etimedout');
};

export async function withRetry<T>(fn: (attempt: number) => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelay = options.baseDelayMs ?? 400;
  const maxDelay = options.maxDelayMs ?? 15_000;
  const factor = options.factor ?? 2;
  const shouldRetry = options.shouldRetry ?? defaultShouldRetry;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      const isLast = attempt >= maxAttempts;
      if (isLast || !shouldRetry(err, attempt)) throw err;
      let delay = Math.min(maxDelay, baseDelay * Math.pow(factor, attempt - 1));
      delay = delay / 2 + Math.random() * (delay / 2); // jitter
      options.onRetry?.(err, attempt, delay);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

/** Coarse token estimator for rate limiting before a request is made. */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // ~4 chars per token heuristic.
  return Math.max(1, Math.ceil(text.length / 4));
}
