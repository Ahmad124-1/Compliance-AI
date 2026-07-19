export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'whatsapp' | 'push' | 'voice';
export type NotificationType = 'assignment' | 'status_update' | 'escalation' | 'reminder' | 'resolution' | 'comment' | 'evidence_request' | 'investigation_started' | 'investigation_completed' | 'case_closed' | 'system';

export interface Notification {
  id: string;
  organizationId: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt: Date | null;
  archivedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreference {
  id: string;
  organizationId: string;
  userId: string;
  channel: NotificationChannel;
  notificationType: NotificationType;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationDelivery {
  id: string;
  organizationId: string;
  notificationId: string;
  channel: NotificationChannel;
  status: string;
  attempts: number;
  lastError: string | null;
  scheduledAt: Date;
  sentAt: Date | null;
  deliveredAt: Date | null;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageTemplate {
  id: string;
  organizationId: string | null;
  name: string;
  channel: string;
  type: string;
  subject: string | null;
  body: string;
  variables: string[];
  locale: string;
  isDefault: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
