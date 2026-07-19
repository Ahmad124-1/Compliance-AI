export const WORKER_COMM_ENDPOINTS = {
  statusUpdates: '/api/v1/worker-communication/status-updates',
  statusUpdate: (id: string) => `/api/v1/worker-communication/status-updates/${id}`,
  timeline: (caseId: string) => `/api/v1/worker-communication/timeline/${caseId}`,
  publicMessage: (caseId: string) => `/api/v1/worker-communication/${caseId}/public-message`,
  requestInfo: (caseId: string) => `/api/v1/worker-communication/${caseId}/request-info`,
  acknowledge: (caseId: string) => `/api/v1/worker-communication/${caseId}/acknowledge`,
  resolutionNotice: (caseId: string) => `/api/v1/worker-communication/${caseId}/resolution-notice`,
  close: (caseId: string) => `/api/v1/worker-communication/${caseId}/close`,
  requestFeedback: (caseId: string) => `/api/v1/worker-communication/${caseId}/request-feedback`,
} as const;

export const WORKER_COMM_ROUTES = {
  list: '/worker-communication',
  timeline: (caseId: string) => `/worker-communication/${caseId}`,
} as const;

export const UPDATE_TYPE_LABELS: Record<string, string> = {
  status_change: 'Status Change',
  case_update: 'Case Update',
  public_message: 'Public Message',
  additional_info_request: 'Info Request',
  acknowledgement: 'Acknowledgement',
  resolution_notice: 'Resolution Notice',
  case_closed: 'Case Closed',
  feedback_request: 'Feedback Request',
};

export const RECIPIENT_LABELS: Record<string, string> = {
  reporter: 'Reporter',
  assigned_to: 'Assigned',
  watchers: 'Watchers',
  all: 'Everyone',
};
