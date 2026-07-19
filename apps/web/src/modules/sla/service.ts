import { slaApi } from './api.js';
import type { SlaDefinition, SlaWorkingHours, SlaHolidayCalendar, SlaInstanceListParams } from './types.js';

export const slaService = {
  listDefinitions: (params?: { type?: string; category?: string; search?: string; limit?: number; offset?: number }) =>
    slaApi.listDefinitions(params),
  createDefinition: (dto: Partial<SlaDefinition>) => slaApi.createDefinition(dto),
  getDefinition: (id: string) => slaApi.getDefinition(id),
  updateDefinition: (id: string, patch: Partial<SlaDefinition>) => slaApi.updateDefinition(id, patch),
  deleteDefinition: (id: string) => slaApi.deleteDefinition(id),
  listInstances: (params?: SlaInstanceListParams) => slaApi.listInstances(params),
  getInstance: (id: string) => slaApi.getInstance(id),
  pauseInstance: (id: string, reason: string | null) => slaApi.pauseInstance(id, reason),
  resumeInstance: (id: string) => slaApi.resumeInstance(id),
  listWorkingHours: () => slaApi.listWorkingHours(),
  saveWorkingHours: (dto: Partial<SlaWorkingHours>) => slaApi.saveWorkingHours(dto),
  getWorkingHours: (id: string) => slaApi.getWorkingHours(id),
  listHolidayCalendars: () => slaApi.listHolidayCalendars(),
  saveHolidayCalendar: (dto: Partial<SlaHolidayCalendar>) => slaApi.saveHolidayCalendar(dto),
};
