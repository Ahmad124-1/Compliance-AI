import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { AUDIT_ENDPOINTS } from './module.constants.js';
import type { AuditSummary, AuditWorkspaceView } from './module.types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const auditApi = {
  list: () => http<AuditSummary[]>(AUDIT_ENDPOINTS.audits),
  create: (dto: Record<string, unknown>) => http<AuditSummary>(AUDIT_ENDPOINTS.audits, { method: 'POST', body: JSON.stringify(dto) }),
  get: (id: string) => http<AuditWorkspaceView>(AUDIT_ENDPOINTS.audit(id)),
  start: (id: string) => http<AuditSummary>(AUDIT_ENDPOINTS.start(id), { method: 'POST' }),
  pause: (id: string) => http<AuditSummary>(AUDIT_ENDPOINTS.pause(id), { method: 'POST' }),
  resume: (id: string) => http<AuditSummary>(AUDIT_ENDPOINTS.resume(id), { method: 'POST' }),
  saveDraft: (id: string) => http<AuditSummary>(AUDIT_ENDPOINTS.saveDraft(id), { method: 'POST' }),
  complete: (id: string) => http<AuditSummary>(AUDIT_ENDPOINTS.complete(id), { method: 'POST' }),
  cancel: (id: string) => http<AuditSummary>(AUDIT_ENDPOINTS.cancel(id), { method: 'POST' }),
  reopen: (id: string) => http<AuditSummary>(AUDIT_ENDPOINTS.reopen(id), { method: 'POST' }),
  clone: (id: string) => http<AuditSummary>(AUDIT_ENDPOINTS.clone(id), { method: 'POST' }),
  createObservation: (id: string, dto: Record<string, unknown>) => http(AUDIT_ENDPOINTS.observations(id), { method: 'POST', body: JSON.stringify(dto) }),
  createFinding: (id: string, dto: Record<string, unknown>) => http(AUDIT_ENDPOINTS.findings(id), { method: 'POST', body: JSON.stringify(dto) }),
  addEvidence: (id: string, dto: Record<string, unknown>) => http(AUDIT_ENDPOINTS.evidence(id), { method: 'POST', body: JSON.stringify(dto) }),
  createInterview: (id: string, dto: Record<string, unknown>) => http(AUDIT_ENDPOINTS.interviews(id), { method: 'POST', body: JSON.stringify(dto) }),
  addSignature: (id: string, dto: Record<string, unknown>) => http(AUDIT_ENDPOINTS.signatures(id), { method: 'POST', body: JSON.stringify(dto) }),
  createCalendarEvent: (id: string, dto: Record<string, unknown>) => http(AUDIT_ENDPOINTS.calendar(id), { method: 'POST', body: JSON.stringify(dto) }),
  addReminder: (id: string, dto: Record<string, unknown>) => http(AUDIT_ENDPOINTS.reminders(id), { method: 'POST', body: JSON.stringify(dto) }),
};
