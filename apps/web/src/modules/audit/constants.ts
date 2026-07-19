export const AUDIT_ENDPOINTS = {
  logs: '/api/v1/audit/logs',
  actions: '/api/v1/audit/actions',
  export: '/api/v1/audit/export',
} as const;

export const ACTION_LABELS: Record<string, string> = {
  'complaint.created': 'Complaint created',
  'complaint.updated': 'Complaint updated',
  'complaint.status_changed': 'Status changed',
  'case.assigned': 'Assignment changed',
  'evidence.uploaded': 'Evidence uploaded',
  'comment.added': 'Comment added',
  'notification.sent': 'Notification sent',
  'qr.generated': 'QR generated',
  'qr.downloaded': 'QR downloaded',
  'settings.changed': 'Settings changed',
  'permissions.changed': 'Permissions changed',
  'escalation.triggered': 'Escalation triggered',
  'sla.event': 'SLA event',
  'search.performed': 'Search performed',
  'auth.login': 'Login',
  'auth.logout': 'Logout',
};
