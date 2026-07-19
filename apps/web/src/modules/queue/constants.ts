export const QUEUE_ENDPOINTS = {
  jobs: '/api/v1/queue/jobs',
  stats: '/api/v1/queue/stats',
  dequeue: (queueName: string) => `/api/v1/queue/${queueName}/dequeue`,
  retry: (id: string) => `/api/v1/queue/jobs/${id}/retry`,
  cancel: (id: string) => `/api/v1/queue/jobs/${id}/cancel`,
  deadLetter: (id: string) => `/api/v1/queue/jobs/${id}/dead-letter`,
  processDeadLetter: (id: string) => `/api/v1/queue/jobs/${id}/process-dead-letter`,
  cleanup: '/api/v1/queue/cleanup',
} as const;

export const QUEUE_ROUTES = {
  dashboard: '/queue',
} as const;

export const QUEUE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  queued: 'Queued',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
  dead_letter: 'Dead Letter',
};

export const QUEUE_CHANNEL_GROUPS: { label: string; queueNames: string[] }[] = [
  { label: 'Notifications', queueNames: ['notifications', 'email', 'sms', 'whatsapp', 'push'] },
  { label: 'Email', queueNames: ['email'] },
  { label: 'SMS', queueNames: ['sms'] },
  { label: 'WhatsApp', queueNames: ['whatsapp'] },
  { label: 'Retry', queueNames: ['retry'] },
  { label: 'Dead Letter', queueNames: ['dead_letter'] },
];
