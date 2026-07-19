export const NOTIFICATION_ENDPOINTS = {
  list: '/api/v1/notifications',
  unreadCount: '/api/v1/notifications/unread-count',
  stats: '/api/v1/notifications/stats',
  create: '/api/v1/notifications',
  get: (id: string) => `/api/v1/notifications/${id}`,
  update: (id: string) => `/api/v1/notifications/${id}`,
  delete: (id: string) => `/api/v1/notifications/${id}`,
  markRead: (id: string) => `/api/v1/notifications/${id}/read`,
  markUnread: (id: string) => `/api/v1/notifications/${id}/unread`,
  archive: (id: string) => `/api/v1/notifications/${id}/archive`,
  markAllRead: '/api/v1/notifications/mark-all-read',
  preferences: '/api/v1/notifications/preferences',
  preferenceUpdate: (id: string) => `/api/v1/notifications/preferences/${id}`,
} as const;

export const NOTIFICATION_ROUTES = {
  list: '/notifications',
  detail: (id: string) => `/notifications/${id}`,
} as const;

export const NOTIFICATION_CHANNEL_LABELS: Record<string, string> = {
  in_app: 'In-App',
  email: 'Email',
  sms: 'SMS',
  push: 'Push',
  webhook: 'Webhook',
  whatsapp: 'WhatsApp',
};

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  case_assigned: 'Case Assigned',
  case_status_changed: 'Status Changed',
  case_escalated: 'Case Escalated',
  sla_breach: 'SLA Breach',
  sla_warning: 'SLA Warning',
  comment_added: 'Comment Added',
  mention: 'Mention',
  worker_update: 'Worker Update',
  new_grievance: 'New Grievance',
  system: 'System',
};

export const NOTIFICATION_STATUS_LABELS: Record<string, string> = {
  unread: 'Unread',
  read: 'Read',
  archived: 'Archived',
};
