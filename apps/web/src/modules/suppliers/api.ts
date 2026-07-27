import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { SUPPLIERS_ENDPOINTS } from './constants.js';
import type { SupplierRecord, SupplierFacilityRecord } from './types.js';

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

export const supplierApi = {
  suppliers: {
    list: (params?: Record<string, unknown>) => http<{ suppliers: SupplierRecord[]; total: number }>(addParams(SUPPLIERS_ENDPOINTS.suppliers, params)),
    get: (id: string) => http<SupplierRecord>(`${SUPPLIERS_ENDPOINTS.suppliers}/${id}`),
    create: (input: Record<string, unknown>) => http<SupplierRecord>(SUPPLIERS_ENDPOINTS.suppliers, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<SupplierRecord>(`${SUPPLIERS_ENDPOINTS.suppliers}/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(`${SUPPLIERS_ENDPOINTS.suppliers}/${id}`, { method: 'DELETE' }),
  },
  stats: {
    get: () => http<{ total: number; highRisk: number; active: number; avgEsgScore: number; avgCarbonScore: number; avgComplianceRate: number; byCountry: Record<string, number>; byIndustry: Record<string, number>; byRiskLevel: Record<string, number> }>(SUPPLIERS_ENDPOINTS.supplierStats),
  },
  ranking: {
    get: () => http<SupplierRecord[]>(SUPPLIERS_ENDPOINTS.supplierRanking),
  },
  facilities: {
    list: (supplierId: string) => http<SupplierFacilityRecord[]>(SUPPLIERS_ENDPOINTS.supplierFacilities(supplierId)),
    create: (supplierId: string, input: Record<string, unknown>) => http<SupplierFacilityRecord>(SUPPLIERS_ENDPOINTS.supplierFacilities(supplierId), { method: 'POST', body: JSON.stringify(input) }),
  },
};