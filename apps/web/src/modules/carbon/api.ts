import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { CARBON_ENDPOINTS } from './constants.js';
import type {
  Facility,
  EmissionSource,
  GhgScope,
  EmissionRecord,
  EmissionFactor,
  CarbonProject,
  CarbonOffset,
  ReductionTarget,
  CarbonReport,
  CarbonDashboard,
  CalculationHistory,
} from './types.js';

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

export const carbonApi = {
  facilities: {
    list: (params?: Record<string, unknown>) =>
      http<Facility[]>(addParams(CARBON_ENDPOINTS.facilities, params)),
    get: (id: string) => http<Facility>(`${CARBON_ENDPOINTS.facilities}/${id}`),
    create: (input: Record<string, unknown>) =>
      http<Facility>(CARBON_ENDPOINTS.facilities, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) =>
      http<Facility>(`${CARBON_ENDPOINTS.facilities}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${CARBON_ENDPOINTS.facilities}/${id}`, { method: 'DELETE' }),
  },
  emissionSources: {
    list: (params?: Record<string, unknown>) =>
      http<EmissionSource[]>(addParams(CARBON_ENDPOINTS.emissionSources, params)),
    get: (id: string) => http<EmissionSource>(`${CARBON_ENDPOINTS.emissionSources}/${id}`),
    create: (input: Record<string, unknown>) =>
      http<EmissionSource>(CARBON_ENDPOINTS.emissionSources, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) =>
      http<EmissionSource>(`${CARBON_ENDPOINTS.emissionSources}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${CARBON_ENDPOINTS.emissionSources}/${id}`, { method: 'DELETE' }),
  },
  scopes: {
    list: (params?: Record<string, unknown>) =>
      http<GhgScope[]>(addParams(CARBON_ENDPOINTS.scopes, params)),
    get: (id: string) => http<GhgScope>(`${CARBON_ENDPOINTS.scopes}/${id}`),
    create: (input: Record<string, unknown>) =>
      http<GhgScope>(CARBON_ENDPOINTS.scopes, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) =>
      http<GhgScope>(`${CARBON_ENDPOINTS.scopes}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${CARBON_ENDPOINTS.scopes}/${id}`, { method: 'DELETE' }),
  },
  emissions: {
    list: (params?: Record<string, unknown>) =>
      http<EmissionRecord[]>(addParams(CARBON_ENDPOINTS.emissions, params)),
    get: (id: string) => http<EmissionRecord>(`${CARBON_ENDPOINTS.emissions}/${id}`),
    create: (input: Record<string, unknown>) =>
      http<EmissionRecord>(CARBON_ENDPOINTS.emissions, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) =>
      http<EmissionRecord>(`${CARBON_ENDPOINTS.emissions}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${CARBON_ENDPOINTS.emissions}/${id}`, { method: 'DELETE' }),
  },
  emissionFactors: {
    list: (params?: Record<string, unknown>) =>
      http<EmissionFactor[]>(addParams(CARBON_ENDPOINTS.emissionFactors, params)),
    get: (id: string) => http<EmissionFactor>(`${CARBON_ENDPOINTS.emissionFactors}/${id}`),
    create: (input: Record<string, unknown>) =>
      http<EmissionFactor>(CARBON_ENDPOINTS.emissionFactors, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) =>
      http<EmissionFactor>(`${CARBON_ENDPOINTS.emissionFactors}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${CARBON_ENDPOINTS.emissionFactors}/${id}`, { method: 'DELETE' }),
  },
  projects: {
    list: (params?: Record<string, unknown>) =>
      http<CarbonProject[]>(addParams(CARBON_ENDPOINTS.projects, params)),
    get: (id: string) => http<CarbonProject>(`${CARBON_ENDPOINTS.projects}/${id}`),
    create: (input: Record<string, unknown>) =>
      http<CarbonProject>(CARBON_ENDPOINTS.projects, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) =>
      http<CarbonProject>(`${CARBON_ENDPOINTS.projects}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${CARBON_ENDPOINTS.projects}/${id}`, { method: 'DELETE' }),
  },
  offsets: {
    list: (params?: Record<string, unknown>) =>
      http<CarbonOffset[]>(addParams(CARBON_ENDPOINTS.offsets, params)),
    get: (id: string) => http<CarbonOffset>(`${CARBON_ENDPOINTS.offsets}/${id}`),
    create: (input: Record<string, unknown>) =>
      http<CarbonOffset>(CARBON_ENDPOINTS.offsets, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) =>
      http<CarbonOffset>(`${CARBON_ENDPOINTS.offsets}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${CARBON_ENDPOINTS.offsets}/${id}`, { method: 'DELETE' }),
  },
  targets: {
    list: (params?: Record<string, unknown>) =>
      http<ReductionTarget[]>(addParams(CARBON_ENDPOINTS.targets, params)),
    get: (id: string) => http<ReductionTarget>(`${CARBON_ENDPOINTS.targets}/${id}`),
    create: (input: Record<string, unknown>) =>
      http<ReductionTarget>(CARBON_ENDPOINTS.targets, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) =>
      http<ReductionTarget>(`${CARBON_ENDPOINTS.targets}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${CARBON_ENDPOINTS.targets}/${id}`, { method: 'DELETE' }),
  },
  reports: {
    list: (params?: Record<string, unknown>) =>
      http<CarbonReport[]>(addParams(CARBON_ENDPOINTS.reports, params)),
    get: (id: string) => http<CarbonReport>(`${CARBON_ENDPOINTS.reports}/${id}`),
    create: (input: Record<string, unknown>) =>
      http<CarbonReport>(CARBON_ENDPOINTS.reports, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) =>
      http<CarbonReport>(`${CARBON_ENDPOINTS.reports}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) =>
      http<{ success: boolean }>(`${CARBON_ENDPOINTS.reports}/${id}`, { method: 'DELETE' }),
  },
  dashboard: {
    get: () => http<CarbonDashboard>(CARBON_ENDPOINTS.dashboard),
  },
  calculate: {
    calculate: (input: Record<string, unknown>) =>
      http<unknown>(CARBON_ENDPOINTS.calculate, { method: 'POST', body: JSON.stringify(input) }),
  },
  calculations: {
    list: (params?: Record<string, unknown>) =>
      http<CalculationHistory[]>(addParams(CARBON_ENDPOINTS.calculations, params)),
    delete: (id: string) =>
      http<{ success: boolean }>(`${CARBON_ENDPOINTS.calculations}/${id}`, { method: 'DELETE' }),
  },
};
