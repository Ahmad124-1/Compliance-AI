export const SUPPLIER_CARBON_ENDPOINTS = {
  carbonRecords: '/api/v1/suppliers/carbon',
  carbonRecord: (id: string) => `/api/v1/suppliers/carbon/${id}`,
  targets: '/api/v1/suppliers/carbon/targets',
  reductionProjects: '/api/v1/suppliers/carbon/projects',
} as const;