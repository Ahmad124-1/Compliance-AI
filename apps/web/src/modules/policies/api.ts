import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { POLICY_ENDPOINTS } from './constants.js';
import type { PolicyRecord, PolicyExport } from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

function addParams(url: string, params?: Record<string, unknown>): string {
  if (!params) return url;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.append(key, String(value));
  }
  const query = qs.toString();
  return query ? `${url}?${query}` : url;
}

export const policiesApi = {
  list: (params?: Record<string, unknown>) => http<PolicyRecord[]>(addParams(POLICY_ENDPOINTS.list, params)),
  get: (id: string) => http<PolicyRecord>(POLICY_ENDPOINTS.get(id)),
  generate: (input: { type: string; context?: Record<string, unknown> }) =>
    http<PolicyRecord>(POLICY_ENDPOINTS.generate, { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: Record<string, unknown>) =>
    http<PolicyRecord>(POLICY_ENDPOINTS.update(id), { method: 'PATCH', body: JSON.stringify(input) }),
  approve: (id: string) => http<PolicyRecord>(POLICY_ENDPOINTS.approve(id), { method: 'POST' }),
  reject: (id: string, reason?: string) =>
    http<PolicyRecord>(POLICY_ENDPOINTS.reject(id), { method: 'POST', body: JSON.stringify({ reason: reason ?? '' }) }),
  export: (id: string, format?: string) => http<PolicyExport>(addParams(POLICY_ENDPOINTS.export(id), { format })),
};

