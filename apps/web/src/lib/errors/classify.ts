import { ApiErrorResponse } from '@/lib/api/client.js';

export type ErrorCategory =
  | 'network'
  | 'authentication'
  | 'permission'
  | 'validation'
  | 'not_found'
  | 'rate_limit'
  | 'server'
  | 'unknown';

export interface ClassifiedError {
  category: ErrorCategory;
  title: string;
  message: string;
  status?: number;
  retryable: boolean;
}

const NETWORK_MESSAGES = ['Failed to fetch', 'NetworkError', 'Network request failed', 'Load failed'];

export function classifyError(error: unknown): ClassifiedError {
  if (error instanceof ApiErrorResponse) {
    switch (error.status) {
      case 400:
        return { category: 'validation', title: 'Validation error', message: error.message, status: error.status, retryable: false };
      case 401:
        return { category: 'authentication', title: 'Authentication required', message: error.message, status: error.status, retryable: false };
      case 403:
        return { category: 'permission', title: 'Access denied', message: error.message, status: error.status, retryable: false };
      case 404:
        return { category: 'not_found', title: 'Not found', message: error.message, status: error.status, retryable: false };
      case 409:
        return { category: 'validation', title: 'Conflict', message: error.message, status: error.status, retryable: false };
      case 422:
        return { category: 'validation', title: 'Invalid input', message: error.message, status: error.status, retryable: false };
      case 429:
        return { category: 'rate_limit', title: 'Too many requests', message: 'You are being rate limited. Please wait a moment and try again.', status: error.status, retryable: true };
      default:
        if (error.status >= 500) {
          return { category: 'server', title: 'Server error', message: error.message, status: error.status, retryable: true };
        }
        return { category: 'unknown', title: 'Something went wrong', message: error.message, status: error.status, retryable: true };
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  if (NETWORK_MESSAGES.some((m) => message.includes(m))) {
    return { category: 'network', title: 'Network error', message: 'Could not reach the server. Check your connection and try again.', retryable: true };
  }
  return { category: 'unknown', title: 'Unexpected error', message, retryable: true };
}
