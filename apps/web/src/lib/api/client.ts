import { QueryClient } from '@tanstack/react-query';

/**
 * Centralized API base URL. Override via NEXT_PUBLIC_API_BASE_URL.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}

/**
 * Minimal typed fetch wrapper for the ComplianceOS API.
 * Attaches the bearer access token from localStorage (or provided getter).
 */
export function createHttpClient(getToken?: () => string | null) {
  return async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const token = getToken?.();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    if (res.status === 204) return undefined as T;

    const text = await res.text();
    const data = text ? JSON.parse(text) : undefined;
    if (!res.ok) {
      const err = (data ?? {}) as ApiError;
      throw new ApiErrorResponse(err.message || res.statusText, res.status, err.error, err.details);
    }
    return data as T;
  };
}

export class ApiErrorResponse extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiErrorResponse';
  }
}

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});
