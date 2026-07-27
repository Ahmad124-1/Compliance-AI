import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { SUPPLIER_CARBON_ENDPOINTS } from './constants.js';
import type { SupplierCarbonRecord, CarbonTarget } from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const supplierCarbonApi = {
  records: {
    list: (params?: Record<string, unknown>) => http<{ records: SupplierCarbonRecord[]; total: number }>(addParams(SUPPLIER_CARBON_ENDPOINTS.carbonRecords, params)),
    get: (id: string) => http<SupplierCarbonRecord>(SUPPLIER_CARBON_ENDPOINTS.carbonRecord(id)),
    create: (input: Record<string, unknown>) => http<SupplierCarbonRecord>(SUPPLIER_CARBON_ENDPOINTS.carbonRecords, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<SupplierCarbonRecord>(SUPPLIER_CARBON_ENDPOINTS.carbonRecord(id), { method: 'PUT', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(SUPPLIER_CARBON_ENDPOINTS.carbonRecord(id), { method: 'DELETE' }),
  },
  targets: {
    list: (params?: Record<string, unknown>) => http<{ targets: CarbonTarget[]; total: number }>(addParams(SUPPLIER_CARBON_ENDPOINTS.targets, params)),
    create: (input: Record<string, unknown>) => http<CarbonTarget>(SUPPLIER_CARBON_ENDPOINTS.targets, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<CarbonTarget>(`${SUPPLIER_CARBON_ENDPOINTS.targets}/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  },
};

function addParams(url: string, params?: Record<string, unknown>): string {
  if (!params) return url;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
  }
  const query = qs.toString();
  return query ? `${url}?${query}` : url;
}