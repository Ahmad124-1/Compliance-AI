/**
 * In-memory sliding-window rate limiter for AI requests.
 *
 * Enforces both requests-per-minute (RPM) and tokens-per-minute (TPM) budgets
 * per organization. A real deployment may back this with Redis; the interface is
 * intentionally small so a distributed implementation can drop in later.
 */
interface Bucket {
  requests: number[]; // timestamps (ms)
  tokens: Array<{ t: number; n: number }>;
}

export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly windowMs = 60_000;

  /**
   * Returns true if the request is allowed under the given budgets, recording
   * the consumption. When false, `retryAfterMs` is set to the wait time.
   */
  allow(key: string, rpmLimit: number, tpmLimit: number, tokenEstimate: number): {
    allowed: boolean;
    retryAfterMs: number;
    remainingRequests: number;
    remainingTokens: number;
  } {
    const now = Date.now();
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { requests: [], tokens: [] };
      this.buckets.set(key, bucket);
    }
    this.evict(bucket, now);

    const reqCount = bucket.requests.length;
    const tokCount = bucket.tokens.reduce((s, x) => s + x.n, 0);

    if (reqCount >= rpmLimit) {
      const wait = bucket.requests[0] + this.windowMs - now;
      return { allowed: false, retryAfterMs: Math.max(0, wait), remainingRequests: 0, remainingTokens: tpmLimit - tokCount };
    }
    if (tokCount + tokenEstimate > tpmLimit) {
      const wait = bucket.tokens[0].t + this.windowMs - now;
      return { allowed: false, retryAfterMs: Math.max(0, wait), remainingRequests: rpmLimit - reqCount, remainingTokens: 0 };
    }

    bucket.requests.push(now);
    bucket.tokens.push({ t: now, n: tokenEstimate });
    return {
      allowed: true,
      retryAfterMs: 0,
      remainingRequests: rpmLimit - reqCount - 1,
      remainingTokens: tpmLimit - tokCount - tokenEstimate,
    };
  }

  private evict(bucket: Bucket, now: number): void {
    const cutoff = now - this.windowMs;
    while (bucket.requests.length && bucket.requests[0] < cutoff) bucket.requests.shift();
    while (bucket.tokens.length && bucket.tokens[0].t < cutoff) bucket.tokens.shift();
  }

  /** Snapshot for diagnostics. */
  stats(key: string): { requests: number; tokens: number } {
    const bucket = this.buckets.get(key);
    if (!bucket) return { requests: 0, tokens: 0 };
    const now = Date.now();
    this.evict(bucket, now);
    return { requests: bucket.requests.length, tokens: bucket.tokens.reduce((s, x) => s + x.n, 0) };
  }
}

export const globalRateLimiter = new RateLimiter();
