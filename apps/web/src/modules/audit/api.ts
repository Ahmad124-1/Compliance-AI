import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { AUDIT_ENDPOINTS } from './constants.js';
import type { AuditListResponse, AuditLogRecord, AuditQueryFilters } from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const auditApi = {
  list: (filters: AuditQueryFilters = {}) => {
    const qs = new URLSearchParams();
    if (filters.actorId) qs.set('actorId', filters.actorId);
    if (filters.action) qs.set('action', filters.action);
    if (filters.entity) qs.set('entity', filters.entity);
    if (filters.entityId) qs.set('entityId', filters.entityId);
    if (filters.severity) qs.set('severity', filters.severity);
    if (filters.dateFrom) qs.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) qs.set('dateTo', filters.dateTo);
    if (filters.limit) qs.set('limit', String(filters.limit));
    if (filters.offset) qs.set('offset', String(filters.offset));
    const q = qs.toString();
    return http<AuditListResponse>(`${AUDIT_ENDPOINTS.logs}${q ? `?${q}` : ''}`);
  },
  actions: () => http<{ actions: string[] }>(AUDIT_ENDPOINTS.actions),
  export: (filters: AuditQueryFilters = {}) => {
    const qs = new URLSearchParams();
    if (filters.dateFrom) qs.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) qs.set('dateTo', filters.dateTo);
    if (filters.action) qs.set('action', filters.action);
    if (filters.limit) qs.set('limit', String(filters.limit));
    return http<{ logs: AuditLogRecord[]; total: number }>(`${AUDIT_ENDPOINTS.export}?${qs.toString()}`);
  },
};
