export const CAPA_ENDPOINTS = {
  findings: '/api/v1/capa/findings',
  nonConformities: '/api/v1/capa/non-conformities',
  capas: '/api/v1/capa',
  capa: (id: string) => `/api/v1/capa/${id}`,
  tasks: (id: string) => `/api/v1/capa/${id}/tasks`,
  rootCauses: (id: string) => `/api/v1/capa/${id}/root-causes`,
  riskAssessments: (id: string) => `/api/v1/capa/${id}/risk-assessments`,
  verificationChecklists: (id: string) => `/api/v1/capa/${id}/verification-checklists`,
  approvals: (id: string) => `/api/v1/capa/${id}/approvals`,
};
