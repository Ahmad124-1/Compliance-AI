import { auditApi } from './api.js';
import type { AuditQueryFilters } from './types.js';

export const auditService = {
  list: (filters?: AuditQueryFilters) => auditApi.list(filters),
  actions: () => auditApi.actions(),
  export: (filters?: AuditQueryFilters) => auditApi.export(filters),
};
