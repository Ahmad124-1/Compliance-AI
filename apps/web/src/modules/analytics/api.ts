import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { ANALYTICS_ENDPOINTS } from './constants.js';
import type { Kpis, TrendPoint, HeatmapCell, CaseAnalytics, DistributionEntry } from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

function qs(params: Record<string, string | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
  const q = p.toString();
  return q ? `?${q}` : '';
}

export const analyticsApi = {
  kpis: (params?: { dateFrom?: string; dateTo?: string }) =>
    http<Kpis>(`${ANALYTICS_ENDPOINTS.kpis}${qs(params ?? {})}`),

  caseAnalytics: (params?: { dateFrom?: string; dateTo?: string; siteId?: string; departmentId?: string }) =>
    http<CaseAnalytics>(`${ANALYTICS_ENDPOINTS.cases}${qs(params ?? {})}`),

  communicationAnalytics: (params?: { dateFrom?: string; dateTo?: string }) =>
    http<Record<string, number> | { channel: string; count: number }[]>(`${ANALYTICS_ENDPOINTS.communication}${qs(params ?? {})}`),

  slaAnalytics: (params?: { dateFrom?: string; dateTo?: string }) =>
    http<Record<string, number>>(`${ANALYTICS_ENDPOINTS.sla}${qs(params ?? {})}`),

  escalationAnalytics: () => http<Record<string, number>>(ANALYTICS_ENDPOINTS.escalations),

  qrAnalytics: (params?: { qrCodeId?: string; dateFrom?: string; dateTo?: string }) =>
    http<Record<string, number>>(`${ANALYTICS_ENDPOINTS.qr}${qs(params ?? {})}`),

  trends: (metric?: string, period?: string) =>
    http<TrendPoint[]>(`${ANALYTICS_ENDPOINTS.trends}${qs({ metric, period })}`),

  heatmap: (metric?: string) => http<HeatmapCell[]>(`${ANALYTICS_ENDPOINTS.heatmap}${qs({ metric })}`),

  refresh: (date?: string) => http<unknown>(ANALYTICS_ENDPOINTS.refresh, { method: 'POST', body: JSON.stringify({ date }) }),
};

export function toDistribution(record?: Record<string, number>): DistributionEntry[] {
  if (!record) return [];
  return Object.entries(record)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}
