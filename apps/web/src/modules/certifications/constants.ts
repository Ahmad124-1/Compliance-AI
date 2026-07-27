export const CERTIFICATIONS_ENDPOINTS = {
  certifications: '/api/v1/suppliers/certifications',
  certification: (id: string) => `/api/v1/suppliers/certifications/${id}`,
  expiring: '/api/v1/suppliers/certifications/expiring',
  verify: (id: string) => `/api/v1/suppliers/certifications/${id}/verify`,
  updateStatus: (id: string) => `/api/v1/suppliers/certifications/${id}/status`,
} as const;

export const CERTIFICATION_TYPES = [
  { value: 'iso_14001', label: 'ISO 14001' },
  { value: 'iso_45001', label: 'ISO 45001' },
  { value: 'iso_9001', label: 'ISO 9001' },
  { value: 'sa8000', label: 'SA8000' },
  { value: 'smeta', label: 'SMETA' },
  { value: 'bsci', label: 'BSCI' },
  { value: 'wrap', label: 'WRAP' },
  { value: 'fsc', label: 'FSC' },
  { value: 'fairtrade', label: 'Fairtrade' },
  { value: 'rainforest_alliance', label: 'Rainforest Alliance' },
  { value: 'organic', label: 'Organic' },
  { value: 'custom', label: 'Custom' },
] as const;

export const CERTIFICATION_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'pending_renewal', label: 'Pending Renewal' },
  { value: 'revoked', label: 'Revoked' },
  { value: 'suspended', label: 'Suspended' },
] as const;