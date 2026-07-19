export const QR_ENDPOINTS = {
  list: '/api/v1/qr-codes',
  stats: '/api/v1/qr-codes/stats',
  create: '/api/v1/qr-codes',
  get: (id: string) => `/api/v1/qr-codes/${id}`,
  update: (id: string) => `/api/v1/qr-codes/${id}`,
  delete: (id: string) => `/api/v1/qr-codes/${id}`,
  regenerate: (id: string) => `/api/v1/qr-codes/${id}/regenerate`,
  download: (id: string) => `/api/v1/qr-codes/${id}/download`,
  analytics: (id: string) => `/api/v1/qr-codes/${id}/analytics`,
  scan: (id: string) => `/api/v1/qr-codes/${id}/scan`,
  orgAnalytics: '/api/v1/qr-scans/analytics',
} as const;

export const QR_ROUTES = {
  list: '/qr-codes',
  detail: (id: string) => `/qr-codes/${id}`,
} as const;

export const QR_TYPE_LABELS: Record<string, string> = {
  organization: 'Organization',
  factory: 'Factory',
  department: 'Department',
  campaign: 'Campaign',
  poster: 'Poster',
};

export const QR_SCOPE_LABELS: Record<string, string> = {
  organization: 'Across the organization',
  factory: 'A specific factory / site',
  department: 'A specific department',
  campaign: 'A temporary campaign',
  poster: 'Physical posters / signage',
};
