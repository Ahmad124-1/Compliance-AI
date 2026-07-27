import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { ENVIRONMENT_ENDPOINTS } from './constants.js';
import type {
  WaterUsage, WasteRecord, AirEmission, Chemical, EnvironmentalIncident,
  EnvironmentalRisk, Permit, ResourceUsage, EnvironmentalProject, EnvironmentalDashboard,
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

export const environmentApi = {
  dashboard: {
    get: () => http<EnvironmentalDashboard>(ENVIRONMENT_ENDPOINTS.dashboard),
  },
  water: {
    list: (params?: Record<string, unknown>) => http<WaterUsage[]>(addParams(ENVIRONMENT_ENDPOINTS.water, params)),
    get: (id: string) => http<WaterUsage>(`${ENVIRONMENT_ENDPOINTS.water}/${id}`),
    create: (input: Record<string, unknown>) => http<WaterUsage>(ENVIRONMENT_ENDPOINTS.water, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<WaterUsage>(`${ENVIRONMENT_ENDPOINTS.water}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.water}/${id}`, { method: 'DELETE' }),
  },
  waste: {
    list: (params?: Record<string, unknown>) => http<WasteRecord[]>(addParams(ENVIRONMENT_ENDPOINTS.waste, params)),
    get: (id: string) => http<WasteRecord>(`${ENVIRONMENT_ENDPOINTS.waste}/${id}`),
    create: (input: Record<string, unknown>) => http<WasteRecord>(ENVIRONMENT_ENDPOINTS.waste, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<WasteRecord>(`${ENVIRONMENT_ENDPOINTS.waste}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.waste}/${id}`, { method: 'DELETE' }),
  },
  air: {
    list: (params?: Record<string, unknown>) => http<AirEmission[]>(addParams(ENVIRONMENT_ENDPOINTS.air, params)),
    get: (id: string) => http<AirEmission>(`${ENVIRONMENT_ENDPOINTS.air}/${id}`),
    create: (input: Record<string, unknown>) => http<AirEmission>(ENVIRONMENT_ENDPOINTS.air, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<AirEmission>(`${ENVIRONMENT_ENDPOINTS.air}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.air}/${id}`, { method: 'DELETE' }),
  },
  chemicals: {
    list: (params?: Record<string, unknown>) => http<Chemical[]>(addParams(ENVIRONMENT_ENDPOINTS.chemicals, params)),
    get: (id: string) => http<Chemical>(`${ENVIRONMENT_ENDPOINTS.chemicals}/${id}`),
    create: (input: Record<string, unknown>) => http<Chemical>(ENVIRONMENT_ENDPOINTS.chemicals, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<Chemical>(`${ENVIRONMENT_ENDPOINTS.chemicals}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.chemicals}/${id}`, { method: 'DELETE' }),
  },
  incidents: {
    list: (params?: Record<string, unknown>) => http<EnvironmentalIncident[]>(addParams(ENVIRONMENT_ENDPOINTS.incidents, params)),
    get: (id: string) => http<EnvironmentalIncident>(`${ENVIRONMENT_ENDPOINTS.incidents}/${id}`),
    create: (input: Record<string, unknown>) => http<EnvironmentalIncident>(ENVIRONMENT_ENDPOINTS.incidents, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<EnvironmentalIncident>(`${ENVIRONMENT_ENDPOINTS.incidents}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.incidents}/${id}`, { method: 'DELETE' }),
  },
  risks: {
    list: (params?: Record<string, unknown>) => http<EnvironmentalRisk[]>(addParams(ENVIRONMENT_ENDPOINTS.risks, params)),
    get: (id: string) => http<EnvironmentalRisk>(`${ENVIRONMENT_ENDPOINTS.risks}/${id}`),
    create: (input: Record<string, unknown>) => http<EnvironmentalRisk>(ENVIRONMENT_ENDPOINTS.risks, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<EnvironmentalRisk>(`${ENVIRONMENT_ENDPOINTS.risks}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.risks}/${id}`, { method: 'DELETE' }),
  },
  permits: {
    list: (params?: Record<string, unknown>) => http<Permit[]>(addParams(ENVIRONMENT_ENDPOINTS.permits, params)),
    get: (id: string) => http<Permit>(`${ENVIRONMENT_ENDPOINTS.permits}/${id}`),
    create: (input: Record<string, unknown>) => http<Permit>(ENVIRONMENT_ENDPOINTS.permits, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<Permit>(`${ENVIRONMENT_ENDPOINTS.permits}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.permits}/${id}`, { method: 'DELETE' }),
  },
  resources: {
    list: (params?: Record<string, unknown>) => http<ResourceUsage[]>(addParams(ENVIRONMENT_ENDPOINTS.resources, params)),
    get: (id: string) => http<ResourceUsage>(`${ENVIRONMENT_ENDPOINTS.resources}/${id}`),
    create: (input: Record<string, unknown>) => http<ResourceUsage>(ENVIRONMENT_ENDPOINTS.resources, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<ResourceUsage>(`${ENVIRONMENT_ENDPOINTS.resources}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.resources}/${id}`, { method: 'DELETE' }),
  },
  projects: {
    list: (params?: Record<string, unknown>) => http<EnvironmentalProject[]>(addParams(ENVIRONMENT_ENDPOINTS.projects, params)),
    get: (id: string) => http<EnvironmentalProject>(`${ENVIRONMENT_ENDPOINTS.projects}/${id}`),
    create: (input: Record<string, unknown>) => http<EnvironmentalProject>(ENVIRONMENT_ENDPOINTS.projects, { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Record<string, unknown>) => http<EnvironmentalProject>(`${ENVIRONMENT_ENDPOINTS.projects}/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) => http<{ success: boolean }>(`${ENVIRONMENT_ENDPOINTS.projects}/${id}`, { method: 'DELETE' }),
  },
};
