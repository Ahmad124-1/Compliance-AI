import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { SUPPLIER_RISK_ENDPOINTS } from './constants.js';
import type { RiskRecord, RiskHeatmapData } from './types.js';

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

export const supplierRiskApi = {
  risks: {
    list: (params?: Record<string, unknown>) => http<{ risks: RiskRecord[]; total: number }>(addParams(SUPPLIER_RISK_ENDPOINTS.risks, params)),
    get: (id: string) => http<RiskRecord>(SUPPLIER_RISK_ENDPOINTS.risk(id)),
    create: (input: Record<string, unknown>) => http<RiskRecord>(SUPPLIER_RISK_ENDPOINTS.risks, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<RiskRecord>(SUPPLIER_RISK_ENDPOINTS.risk(id), { method: 'PUT', body: JSON.stringify(input) }),
    close: (id: string) => http<RiskRecord>(SUPPLIER_RISK_ENDPOINTS.closeRisk(id), { method: 'POST' }),
    delete: (id: string) => http<{ success: boolean }>(SUPPLIER_RISK_ENDPOINTS.risk(id), { method: 'DELETE' }),
  },
  heatmap: {
    get: () => http<RiskHeatmapData>(SUPPLIER_RISK_ENDPOINTS.riskHeatmap),
  },
};