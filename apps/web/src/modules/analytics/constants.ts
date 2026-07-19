export const ANALYTICS_ENDPOINTS = {
  cases: '/api/v1/analytics/cases',
  communication: '/api/v1/analytics/communication',
  sla: '/api/v1/analytics/sla',
  escalations: '/api/v1/analytics/escalations',
  qr: '/api/v1/analytics/qr',
  kpis: '/api/v1/analytics/kpis',
  trends: '/api/v1/analytics/trends',
  heatmap: '/api/v1/analytics/heatmap',
  refresh: '/api/v1/analytics/refresh',
} as const;

export const ANALYTICS_ROUTES = {
  dashboard: '/analytics',
} as const;

export const ANALYTICS_METRIC_LABELS: Record<string, string> = {
  cases: 'Cases',
  communication: 'Communication',
  sla: 'SLA',
  escalations: 'Escalations',
  qr: 'QR Scans',
};

export const ANALYTICS_PERIOD_LABELS: Record<string, string> = {
  day: 'Daily',
  month: 'Monthly',
};
