export const CASE_ENDPOINTS = {
  list: '/api/v1/cases',
  stats: '/api/v1/cases/stats',
  create: '/api/v1/cases',
  get: (id: string) => `/api/v1/cases/${id}`,
  update: (id: string) => `/api/v1/cases/${id}`,
  delete: (id: string) => `/api/v1/cases/${id}`,
  restore: (id: string) => `/api/v1/cases/${id}/restore`,
  merge: (id: string) => `/api/v1/cases/${id}/merge`,
  duplicates: (id: string) => `/api/v1/cases/${id}/duplicates`,
  tags: {
    add: (id: string) => `/api/v1/cases/${id}/tags`,
    remove: (id: string, tag: string) => `/api/v1/cases/${id}/tags/${encodeURIComponent(tag)}`,
  },
  labels: {
    add: (id: string) => `/api/v1/cases/${id}/labels`,
    remove: (id: string, label: string) => `/api/v1/cases/${id}/labels/${encodeURIComponent(label)}`,
  },
  watchers: {
    add: (id: string) => `/api/v1/cases/${id}/watchers`,
    remove: (id: string, userId: string) => `/api/v1/cases/${id}/watchers/${userId}`,
  },
  assign: (id: string) => `/api/v1/cases/${id}/assign`,
  unassign: (id: string, userId: string) => `/api/v1/cases/${id}/assign/${userId}`,
  comments: {
    list: (id: string) => `/api/v1/cases/${id}/comments`,
    add: (id: string) => `/api/v1/cases/${id}/comments`,
    update: (id: string, commentId: string) => `/api/v1/cases/${id}/comments/${commentId}`,
    delete: (id: string, commentId: string) => `/api/v1/cases/${id}/comments/${commentId}`,
  },
  notes: {
    add: (id: string) => `/api/v1/cases/${id}/notes`,
  },
  responses: {
    add: (id: string) => `/api/v1/cases/${id}/responses`,
  },
  evidence: {
    list: (id: string) => `/api/v1/cases/${id}/evidence`,
    add: (id: string) => `/api/v1/cases/${id}/evidence`,
  },
  witnesses: {
    add: (id: string) => `/api/v1/cases/${id}/witnesses`,
  },
  interviews: {
    add: (id: string) => `/api/v1/cases/${id}/interviews`,
  },
  findings: {
    add: (id: string) => `/api/v1/cases/${id}/findings`,
  },
  rootCauses: {
    add: (id: string) => `/api/v1/cases/${id}/root-causes`,
  },
  resolutions: {
    add: (id: string) => `/api/v1/cases/${id}/resolutions`,
  },
  links: {
    add: (id: string) => `/api/v1/cases/${id}/links`,
    remove: (id: string, relatedCaseId: string) => `/api/v1/cases/${id}/links/${relatedCaseId}`,
  },
  bulk: (id: string) => `/api/v1/cases/${id}/bulk`,
  bulkMultiple: '/api/v1/cases/bulk',
  savedFilters: {
    list: '/api/v1/cases/saved-filters',
    create: '/api/v1/cases/:id/saved-filters',
  },
  investigations: {
    create: (id: string) => `/api/v1/cases/${id}/investigations`,
    get: (id: string) => `/api/v1/cases/${id}/investigations`,
    update: (id: string) => `/api/v1/cases/${id}/investigations`,
    assignments: {
      list: (id: string) => `/api/v1/cases/${id}/investigations/assignments`,
      add: (id: string) => `/api/v1/cases/${id}/investigations/assignments`,
      remove: (id: string, investigatorId: string) => `/api/v1/cases/${id}/investigations/assignments/${investigatorId}`,
    },
    timeline: (id: string) => `/api/v1/cases/${id}/investigations/timeline`,
  },
  investigators: {
    list: '/api/v1/investigators',
    workload: '/api/v1/investigations/workload',
  },
  escalation: {
    escalate: (id: string) => `/api/v1/cases/${id}/escalate`,
    history: (id: string) => `/api/v1/cases/${id}/escalation-history`,
  },
  risk: {
    calculate: (id: string) => `/api/v1/cases/${id}/risk/calculate`,
    get: (id: string) => `/api/v1/cases/${id}/risk`,
  },
} as const;

export const CASE_ROUTES = {
  list: '/admin/cases',
  detail: (id: string) => `/admin/cases/${id}`,
  create: '/admin/cases/create',
  stats: '/admin/cases/stats',
} as const;

export const CASE_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  under_investigation: 'Under Investigation',
  escalated: 'Escalated',
  pending_review: 'Pending Review',
  resolved: 'Resolved',
  closed: 'Closed',
  archived: 'Archived',
};

export const CASE_PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const CASE_SEVERITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const CASE_SOURCE_LABELS: Record<string, string> = {
  website: 'Website',
  qr: 'QR Code',
  email: 'Email',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  phone: 'Phone',
  walk_in: 'Walk-in',
  suggestion_box: 'Suggestion Box',
  ngo: 'NGO',
  union: 'Union',
  government: 'Government',
};
