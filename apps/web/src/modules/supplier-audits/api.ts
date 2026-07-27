import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { AUDIT_ENDPOINTS } from './constants.js';
import type { AuditRecord, AuditSummary, AuditFinding, AuditEvidence, AuditApproval } from './types.js';

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

export const supplierAuditApi = {
  audits: {
    list: (params?: Record<string, unknown>) => http<{ audits: AuditRecord[]; total: number }>(addParams(AUDIT_ENDPOINTS.audits, params)),
    get: (id: string) => http<AuditRecord>(AUDIT_ENDPOINTS.audit(id)),
    create: (input: Record<string, unknown>) => http<AuditRecord>(AUDIT_ENDPOINTS.audits, { method: 'POST', body: JSON.stringify(input) }),
    updateStatus: (id: string, status: string) => http<AuditRecord>(AUDIT_ENDPOINTS.auditStatus(id), { method: 'POST', body: JSON.stringify({ status }) }),
    addFinding: (id: string, finding: Record<string, unknown>) => http<AuditRecord>(AUDIT_ENDPOINTS.auditFindings(id), { method: 'POST', body: JSON.stringify(finding) }),
    addEvidence: (id: string, evidence: Record<string, unknown>) => http<AuditRecord>(AUDIT_ENDPOINTS.auditEvidence(id), { method: 'POST', body: JSON.stringify(evidence) }),
    addApproval: (id: string, approval: Record<string, unknown>) => http<AuditRecord>(AUDIT_ENDPOINTS.auditApprovals(id), { method: 'POST', body: JSON.stringify(approval) }),
    delete: (id: string) => http<{ success: boolean }>(AUDIT_ENDPOINTS.audit(id), { method: 'DELETE' }),
  },
};