import { describe, expect, it } from 'vitest';

import { classifyError } from '@/lib/errors/classify.js';
import { withRetry } from '@/lib/errors/retry.js';
import { ApiErrorResponse } from '@/lib/api/client.js';

describe('classifyError', () => {
  it('classifies 401 as authentication', () => {
    const c = classifyError(new ApiErrorResponse('unauthorized', 401, 'UNAUTHORIZED'));
    expect(c.category).toBe('authentication');
    expect(c.retryable).toBe(false);
  });

  it('classifies 403 as permission', () => {
    const c = classifyError(new ApiErrorResponse('forbidden', 403, 'FORBIDDEN'));
    expect(c.category).toBe('permission');
  });

  it('classifies 429 as rate_limit and retryable', () => {
    const c = classifyError(new ApiErrorResponse('slow down', 429, 'RATE_LIMITED'));
    expect(c.category).toBe('rate_limit');
    expect(c.retryable).toBe(true);
  });

  it('classifies 500+ as server and retryable', () => {
    const c = classifyError(new ApiErrorResponse('boom', 503, 'BAD_GATEWAY'));
    expect(c.category).toBe('server');
    expect(c.retryable).toBe(true);
  });

  it('classifies network failures', () => {
    const c = classifyError(new Error('Failed to fetch'));
    expect(c.category).toBe('network');
  });

  it('classifies unknown errors as retryable unknown', () => {
    const c = classifyError(new Error('weird'));
    expect(c.category).toBe('unknown');
  });
});

describe('withRetry', () => {
  it('returns immediately on success', async () => {
    const result = await withRetry(async () => 'ok', { retries: 2 });
    expect(result).toBe('ok');
  });

  it('retries until success', async () => {
    let attempts = 0;
    const result = await withRetry(
      async () => {
        attempts += 1;
        if (attempts < 3) throw new Error('transient');
        return 'done';
      },
      { retries: 3, delayMs: 1 },
    );
    expect(result).toBe('done');
    expect(attempts).toBe(3);
  });

  it('throws after exhausting retries', async () => {
    await expect(withRetry(async () => { throw new Error('always'); }, { retries: 2, delayMs: 1 })).rejects.toThrow('always');
  });
});
