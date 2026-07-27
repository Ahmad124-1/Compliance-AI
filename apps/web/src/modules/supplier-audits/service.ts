import { supplierAuditApi } from './api.js';

export const supplierAuditService = {
  listAudits: (params?: Record<string, unknown>) => supplierAuditApi.audits.list(params),
  getAudit: (id: string) => supplierAuditApi.audits.get(id),
  createAudit: (input: Record<string, unknown>) => supplierAuditApi.audits.create(input),
  updateAuditStatus: (id: string, status: string) => supplierAuditApi.audits.updateStatus(id, status),
  addFinding: (id: string, finding: Record<string, unknown>) => supplierAuditApi.audits.addFinding(id, finding),
  addEvidence: (id: string, evidence: Record<string, unknown>) => supplierAuditApi.audits.addEvidence(id, evidence),
  addApproval: (id: string, approval: Record<string, unknown>) => supplierAuditApi.audits.addApproval(id, approval),
  deleteAudit: (id: string) => supplierAuditApi.audits.delete(id),
};