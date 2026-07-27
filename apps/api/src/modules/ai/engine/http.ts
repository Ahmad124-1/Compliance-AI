/**
 * Minimal fetch-based HTTP client with JSON + SSE/streaming support.
 *
 * Provides a single `request` helper used by all provider adapters so network
 * behavior (timeouts, error shaping, streaming) is consistent. Uses the global
 * `fetch` (Node 18+).
 */
export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: string | Uint8Array;
  /** Abort after this many ms. */
  timeoutMs?: number;
  /** When true, resolves with the raw Response instead of parsing JSON. */
  raw?: boolean;
}

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown = undefined,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export async function httpRequest<T = unknown>(url: string, options: HttpRequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 30_000);
  try {
    const res = await fetch(url, {
      method: options.method ?? 'GET',
      headers: options.headers,
      body: options.body,
      signal: controller.signal,
    });
    if (!res.ok) {
      let detail: unknown;
      try {
        detail = await res.json();
      } catch {
        detail = await res.text().catch(() => undefined);
      }
      throw new HttpError(`HTTP ${res.status} ${res.statusText}`, res.status, detail);
    }
    if (options.raw) return res as unknown as T;
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export interface SseHandlers {
  onEvent: (event: string, data: string) => void;
  onDone?: () => void;
  onError?: (err: unknown) => void;
}

/**
 * Stream a Server-Sent-Events / chunked JSON body. The parser tolerates both
 * OpenAI-style `data: {...}` lines and newline-delimited JSON. Calls `onEvent`
 * with the raw data payload string for each chunk.
 */
export async function streamSse(url: string, options: HttpRequestOptions, handlers: SseHandlers): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 120_000);
  let buffer = '';
  try {
    const res = await fetch(url, {
      method: options.method ?? 'POST',
      headers: options.headers,
      body: options.body,
      signal: controller.signal,
    });
    if (!res.ok || !res.body) {
      let detail: unknown;
      try { detail = await res.json(); } catch { detail = await res.text().catch(() => undefined); }
      throw new HttpError(`HTTP ${res.status} ${res.statusText}`, res.status, detail);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    // deno-lint-ignore no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (trimmed.startsWith('data:')) {
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') { handlers.onDone?.(); return; }
          try {
            const parsed = JSON.parse(data);
            handlers.onEvent(parsed.type ?? 'message', data);
          } catch {
            handlers.onEvent('message', data);
          }
        } else if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          handlers.onEvent('message', trimmed);
        }
      }
    }
    handlers.onDone?.();
  } catch (err) {
    handlers.onError?.(err);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
