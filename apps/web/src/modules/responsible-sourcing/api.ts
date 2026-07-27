import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { RESPONSIBLE_SOURCING_ENDPOINTS } from './constants.js';
import type { ResponsibleMaterialRecord, SourcingSummary } from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

function addParams(url: string, params?: Record<string, unknown>): string {
  if (!params) return url;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
  }
  const query = qs.toString();
  return query ? `${url}?${query}` : url;
}

export const responsibleSourcingApi = {
  materials: {
    list: (params?: Record<string, unknown>) => http<{ materials: ResponsibleMaterialRecord[]; total: number }>(addParams(RESPONSIBLE_SOURCING_ENDPOINTS.materials, params)),
    get: (id: string) => http<ResponsibleMaterialRecord>(RESPONSIBLE_SOURCING_ENDPOINTS.material(id)),
    create: (input: Record<string, unknown>) => http<ResponsibleMaterialRecord>(RESPONSIBLE_SOURCING_ENDPOINTS.materials, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<ResponsibleMaterialRecord>(RESPONSIBLE_SOURCING_ENDPOINTS.material(id), { method: 'PUT', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(RESPONSIBLE_SOURCING_ENDPOINTS.material(id), { method: 'DELETE' }),
  },
  summary: {
    get: () => http<SourcingSummary>(RESPONSIBLE_SOURCING_ENDPOINTS.sourcingSummary),
  },
};