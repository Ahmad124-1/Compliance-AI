export const WORKER_ENDPOINTS = {
  profile: '/api/v1/workers/profile',
  directory: '/api/v1/workers/directory',
  tasks: '/api/v1/workers/tasks',
  documents: '/api/v1/workers/documents',
  forms: '/api/v1/workers/forms',
  learning: '/api/v1/workers/learning',
  announcements: '/api/v1/workers/announcements',
} as const;

export const WORKER_ROUTES = {
  overview: '/workers',
  profile: '/workers/profile',
  directory: '/workers/directory',
  announcements: '/workers/announcements',
  tasks: '/workers/tasks',
  documents: '/workers/documents',
  forms: '/workers/forms',
  learning: '/workers/learning',
  support: '/workers/support',
  settings: '/workers/settings',
} as const;

export const TASK_TYPE_LABELS: Record<string, string> = {
  task: 'Task',
  capa: 'CAPA',
  approval: 'Approval',
  form: 'Form',
  event: 'Event',
  training: 'Training',
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  overdue: 'Overdue',
};

export const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  policy: 'Policy',
  employment: 'Employment',
  safety: 'Safety',
  handbook: 'Handbook',
  certificate: 'Certificate',
  payslip: 'Payslip',
};

export const FORM_TYPE_LABELS: Record<string, string> = {
  leave: 'Leave Request',
  document_request: 'Document Request',
  general: 'General Request',
  improvement: 'Improvement Suggestion',
  internal: 'Internal Form',
};

export const FORM_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_review: 'In Review',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const LEARNING_TYPE_LABELS: Record<string, string> = {
  course: 'Course',
  video: 'Video',
  document: 'Document',
  quiz: 'Quiz',
};

export const LEARNING_STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  certified: 'Certified',
};
