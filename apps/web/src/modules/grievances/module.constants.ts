export const GRIEVANCE_ENDPOINTS = {
  publicCategories: '/public/categories',
  publicLanguages: '/public/languages',
  publicSources: '/public/sources',
  publicChannels: '/public/channels',
  publicComplaints: '/public/complaints',
  publicTrack: '/public/track',
  adminGrievances: '/api/v1/admin/grievances',
  adminGrievance: (id: string) => `/api/v1/admin/grievances/${id}`,
  adminAttachments: (id: string) => `/api/v1/admin/grievances/${id}/attachments`,
  adminCategories: '/api/v1/admin/categories',
  adminCreateCategory: '/api/v1/admin/categories/create',
  adminPortalConfig: '/api/v1/admin/portal-config',
  adminQrPortals: '/api/v1/admin/qr-portals',
} as const;

export const GRIEVANCE_ROUTES = {
  submit: '/grievances',
  track: '/track-grievance',
  list: '/admin/grievances',
  detail: (id: string) => `/admin/grievances/${id}`,
  categories: '/admin/grievances/categories',
  portalConfig: '/admin/grievances/portal-config',
  qrPortals: '/admin/grievances/qr-portals',
} as const;

export const GRIEVANCE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  under_review: 'Under Review',
  escalated: 'Escalated',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const GRIEVANCE_PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const GRIEVANCE_SEVERITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};
