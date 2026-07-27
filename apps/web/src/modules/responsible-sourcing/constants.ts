export const RESPONSIBLE_SOURCING_ENDPOINTS = {
  materials: '/api/v1/suppliers/materials',
  material: (id: string) => `/api/v1/suppliers/materials/${id}`,
  sourcingSummary: '/api/v1/suppliers/sourcing-summary',
} as const;