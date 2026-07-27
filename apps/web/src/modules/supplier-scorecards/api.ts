import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { SUPPLIER_SCORECARD_ENDPOINTS } from './constants.js';
import type { ScorecardRecord, BenchmarkResult } from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const supplierScorecardApi = {
  scorecards: {
    list: (params?: Record<string, unknown>) => http<{ scorecards: ScorecardRecord[]; total: number }>(addParams(SUPPLIER_SCORECARD_ENDPOINTS.scorecards, params)),
    getLatest: (supplierId: string) => http<ScorecardRecord | null>(SUPPLIER_SCORECARD_ENDPOINTS.latest(supplierId)),
    getBenchmark: () => http<BenchmarkResult[]>(SUPPLIER_SCORECARD_ENDPOINTS.benchmark),
    create: (input: Record<string, unknown>) => http<ScorecardRecord>(SUPPLIER_SCORECARD_ENDPOINTS.scorecards, { method: 'POST', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(`${SUPPLIER_SCORECARD_ENDPOINTS.scorecard(id)}`, { method: 'DELETE' }),
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