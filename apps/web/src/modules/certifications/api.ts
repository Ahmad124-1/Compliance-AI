import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { CERTIFICATIONS_ENDPOINTS } from './constants.js';
import type { CertificationRecord, CertificationSummary } from './types.js';

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

export const certificationApi = {
  certifications: {
    list: (params?: Record<string, unknown>) => http<{ certifications: CertificationRecord[]; total: number }>(addParams(CERTIFICATIONS_ENDPOINTS.certifications, params)),
    get: (id: string) => http<CertificationRecord>(CERTIFICATIONS_ENDPOINTS.certification(id)),
    create: (input: Record<string, unknown>) => http<CertificationRecord>(CERTIFICATIONS_ENDPOINTS.certifications, { method: 'POST', body: JSON.stringify(input) }),
    verify: (id: string, status: string) => http<CertificationRecord>(CERTIFICATIONS_ENDPOINTS.verify(id), { method: 'PUT', body: JSON.stringify({ status }) }),
    updateStatus: (id: string, status: string) => http<CertificationRecord>(CERTIFICATIONS_ENDPOINTS.updateStatus(id), { method: 'PUT', body: JSON.stringify({ status }) }),
    delete: (id: string) => http<{ success: boolean }>(CERTIFICATIONS_ENDPOINTS.certification(id), { method: 'DELETE' }),
  },
  expiring: {
    get: (daysAhead?: number) => http<CertificationSummary[]>(`${CERTIFICATIONS_ENDPOINTS.expiring}${daysAhead ? `?daysAhead=${daysAhead}` : ''}`),
  },
};