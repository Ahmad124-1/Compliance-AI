export const STANDARDS_ENDPOINTS = {
  standards: '/api/v1/standards/standards',
  dashboard: '/api/v1/standards/standards/dashboard',
  frameworks: '/api/v1/standards/frameworks',
  search: '/api/v1/standards/search',
  organizationFrameworks: '/api/v1/standards/organization-frameworks',
} as const;

export const STANDARDS_ROUTES = {
  dashboard: '/standards',
  library: '/standards/library',
  frameworkDetails: (id = ':id') => `/standards/${id}`,
  assignment: (id = ':id') => `/standards/${id}/assignment`,
  settings: (id = ':id') => `/standards/${id}/settings`,
} as const;

export const STANDARD_CATEGORY_LABELS: Record<string, string> = {
  quality: 'Quality',
  environment: 'Environment',
  social: 'Social',
  energy: 'Energy',
  esg: 'ESG',
  custom: 'Custom',
};

export const COMPLIANCE_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  compliant: 'Compliant',
  not_applicable: 'N/A',
};

export const CONTROL_STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  implemented: 'Implemented',
  not_applicable: 'N/A',
};
