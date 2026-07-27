export const SUPPLIER_SCORECARD_ENDPOINTS = {
  scorecards: '/api/v1/suppliers/scorecards',
  scorecard: (id: string) => `/api/v1/suppliers/scorecards/${id}`,
  latest: (supplierId: string) => `/api/v1/suppliers/scorecards/latest/${supplierId}`,
  benchmark: '/api/v1/suppliers/scorecards/benchmark',
} as const;