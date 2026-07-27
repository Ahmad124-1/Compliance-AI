export const AUDIT_ENDPOINTS = {
  audits: '/api/v1/suppliers/audits',
  audit: (id: string) => `/api/v1/suppliers/audits/${id}`,
  auditStatus: (id: string) => `/api/v1/suppliers/audits/${id}/status`,
  auditFindings: (id: string) => `/api/v1/suppliers/audits/${id}/findings`,
  auditEvidence: (id: string) => `/api/v1/suppliers/audits/${id}/evidence`,
  auditApprovals: (id: string) => `/api/v1/suppliers/audits/${id}/approvals`,
} as const;