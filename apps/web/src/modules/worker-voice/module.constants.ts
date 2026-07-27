export const WORKER_VOICE_ENDPOINTS = {
  dashboard: '/api/v1/worker-voice/dashboard',
  report: '/api/v1/worker-voice/report',
  myCases: '/api/v1/worker-voice/my-cases',
  trackCase: (id: string) => `/api/v1/worker-voice/cases/${encodeURIComponent(id)}/track`,
  hotline: '/api/v1/worker-voice/hotline',
  emergencyReport: '/api/v1/worker-voice/hotline/emergency',
  getEvidence: (caseId: string) => `/api/v1/worker-voice/evidence/${encodeURIComponent(caseId)}`,
  addEvidence: (caseId: string) => `/api/v1/worker-voice/evidence/${encodeURIComponent(caseId)}`,
  qrList: '/api/v1/worker-voice/qr',
  qrGenerate: '/api/v1/worker-voice/qr/generate',
} as const;

export const WORKER_VOICE_ROUTES = {
  dashboard: '/worker-voice',
  myCases: '/worker-voice/my-cases',
  report: '/worker-voice/report',
  hotline: '/worker-voice/hotline',
  aiAssistant: '/worker-voice/ai-assistant',
  knowledgeCenter: '/worker-voice/knowledge-center',
  emergencyHelp: '/worker-voice/emergency-help',
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

export const CASE_PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export const WORKER_VOICE_CATEGORIES = [
  { value: 'grievance', label: 'Grievance' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'discrimination', label: 'Discrimination' },
  { value: 'forced_labour', label: 'Forced Labour' },
  { value: 'child_labour', label: 'Child Labour' },
  { value: 'health_safety', label: 'Health & Safety' },
  { value: 'wage_issue', label: 'Wage Issue' },
  { value: 'overtime', label: 'Overtime' },
  { value: 'abuse', label: 'Abuse' },
  { value: 'environment', label: 'Environment' },
  { value: 'ethics', label: 'Ethics' },
  { value: 'corruption', label: 'Corruption' },
  { value: 'supplier_concern', label: 'Supplier Concern' },
  { value: 'human_rights', label: 'Human Rights' },
  { value: 'other', label: 'Other' },
] as const;

export const WORKER_VOICE_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
] as const;

export const QR_TYPES = [
  { value: 'factory', label: 'Factory QR' },
  { value: 'department', label: 'Department QR' },
  { value: 'dormitory', label: 'Dormitory QR' },
  { value: 'canteen', label: 'Canteen QR' },
  { value: 'production_line', label: 'Production Line QR' },
  { value: 'notice_board', label: 'Notice Board QR' },
] as const;
