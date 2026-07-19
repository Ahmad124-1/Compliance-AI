export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push' | 'webhook' | 'whatsapp';

export type NotificationType =
  | 'case_assigned'
  | 'case_status_changed'
  | 'case_escalated'
  | 'sla_breach'
  | 'sla_warning'
  | 'comment_added'
  | 'mention'
  | 'worker_update'
  | 'new_grievance'
  | 'system';

export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface NotificationDelivery {
  id: string;
  notificationId: string;
  channel: NotificationChannel;
  status: 'pending' | 'sent' | 'failed' | 'suppressed';
  sentAt: string | null;
  error: string | null;
  attempts: number;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  organizationId: string | null;
  channel: NotificationChannel;
  notificationType: NotificationType;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  organizationId: string;
  recipientId: string;
  actorId: string | null;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  status: NotificationStatus;
  readAt: string | null;
  archivedAt: string | null;
  channels: NotificationChannel[];
  deliveries: NotificationDelivery[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
}

export type {
  NotificationCreateInput,
  NotificationUpdateInput,
  PreferenceUpdateInput,
  NotificationListParams,
} from './validation.js';
