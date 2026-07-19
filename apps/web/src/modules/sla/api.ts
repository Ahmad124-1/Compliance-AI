import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { SLA_ENDPOINTS } from './constants.js';
import type {
  SlaDefinition,
  SlaInstance,
  SlaWorkingHours,
  SlaHolidayCalendar,
  SlaInstanceListParams,
} from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const slaApi = {
  listDefinitions: (params?: { type?: string; category?: string; search?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.type) qs.set('type', params.type);
    if (params?.category) qs.set('category', params.category);
    if (params?.search) qs.set('search', params.search);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const q = qs.toString();
    return http<{ definitions: SlaDefinition[]; total: number }>(`${SLA_ENDPOINTS.definitions}${q ? `?${q}` : ''}`);
  },

  createDefinition: (dto: Partial<SlaDefinition>) =>
    http<SlaDefinition>(SLA_ENDPOINTS.definitions, { method: 'POST', body: JSON.stringify(dto) }),

  getDefinition: (id: string) => http<SlaDefinition>(SLA_ENDPOINTS.definition(id)),

  updateDefinition: (id: string, patch: Partial<SlaDefinition>) =>
    http<SlaDefinition>(SLA_ENDPOINTS.definition(id), { method: 'PATCH', body: JSON.stringify(patch) }),

  deleteDefinition: (id: string) => http<void>(SLA_ENDPOINTS.definitionDelete(id), { method: 'DELETE' }),

  listInstances: (params?: SlaInstanceListParams) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.entityType) qs.set('entityType', params.entityType);
    if (params?.definitionId) qs.set('definitionId', params.definitionId);
    if (params?.breached !== undefined) qs.set('breached', String(params.breached));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const q = qs.toString();
    return http<{ instances: SlaInstance[]; total: number }>(`${SLA_ENDPOINTS.instances}${q ? `?${q}` : ''}`);
  },

  getInstance: (id: string) => http<SlaInstance>(SLA_ENDPOINTS.instance(id)),

  pauseInstance: (id: string, reason: string | null) =>
    http<SlaInstance>(SLA_ENDPOINTS.pause(id), { method: 'POST', body: JSON.stringify({ reason }) }),

  resumeInstance: (id: string) => http<SlaInstance>(SLA_ENDPOINTS.resume(id), { method: 'POST' }),

  listWorkingHours: () => http<SlaWorkingHours[]>(SLA_ENDPOINTS.workingHours),

  saveWorkingHours: (dto: Partial<SlaWorkingHours>) =>
    http<SlaWorkingHours>(SLA_ENDPOINTS.workingHours, { method: 'POST', body: JSON.stringify(dto) }),

  getWorkingHours: (id: string) => http<SlaWorkingHours>(SLA_ENDPOINTS.workingHour(id)),

  listHolidayCalendars: () => http<SlaHolidayCalendar[]>(SLA_ENDPOINTS.holidayCalendars),

  saveHolidayCalendar: (dto: Partial<SlaHolidayCalendar>) =>
    http<SlaHolidayCalendar>(SLA_ENDPOINTS.holidayCalendars, { method: 'POST', body: JSON.stringify(dto) }),
};
