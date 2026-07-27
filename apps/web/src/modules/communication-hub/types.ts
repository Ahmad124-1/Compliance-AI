export interface CommunicationHubMessage {
  id: string;
  organizationId: string;
  conversationId?: string;
  senderId?: string;
  recipientId?: string;
  type: string;
  category: string;
  priority: string;
  subject?: string;
  body: string;
  channel: string;
  channels: string[];
  locale: string;
  attachments: any[];
  metadata: Record<string, unknown>;
  encrypted: boolean;
  readAt?: string;
  deliveredAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationHubConversation {
  id: string;
  organizationId: string;
  title?: string;
  type: string;
  category?: string;
  isEncrypted: boolean;
  isArchived: boolean;
  metadata: Record<string, unknown>;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Broadcast {
  id: string;
  organizationId: string;
  senderId?: string;
  title: string;
  body: string;
  broadcastType: string;
  priority: string;
  scope: Record<string, unknown>;
  channels: string[];
  locale: string;
  attachments: any[];
  acknowledgementRequired: boolean;
  readTracking: boolean;
  expiryDate?: string;
  pinned: boolean;
  scheduledAt?: string;
  sentAt?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface BroadcastRecipient {
  id: string;
  broadcastId: string;
  organizationId: string;
  userId?: string;
  channel: string;
  status: string;
  readAt?: string;
  acknowledgedAt?: string;
  deliveredAt?: string;
  sentAt?: string;
  attempts: number;
  lastError?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyAlert {
  id: string;
  organizationId: string;
  senderId?: string;
  title: string;
  body: string;
  alertType: string;
  priority: string;
  severity: string;
  scope: Record<string, unknown>;
  channels: string[];
  instructions?: string;
  requiresAcknowledgement: boolean;
  escalationEnabled: boolean;
  escalationAfterMinutes: number;
  isActive: boolean;
  expiresAt?: string;
  acknowledgedCount: number;
  totalRecipients: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyAcknowledgement {
  id: string;
  emergencyAlertId: string;
  organizationId: string;
  userId?: string;
  status: string;
  note?: string;
  location: Record<string, unknown>;
  acknowledgedAt: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  eventType: string;
  priority: string;
  location?: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  timezone: string;
  recurrenceRule?: string;
  scope: Record<string, unknown>;
  reminderMinutes: number[];
  channels: string[];
  metadata: Record<string, unknown>;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventAttendee {
  id: string;
  calendarEventId: string;
  organizationId: string;
  userId?: string;
  status: string;
  responseAt?: string;
  checkedInAt?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelConfig {
  id: string;
  organizationId: string;
  userId?: string;
  channel: string;
  priority: number;
  enabled: boolean;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationAnalytics {
  messageDeliveryRate: number;
  readRate: number;
  acknowledgementRate: number;
  engagementScore: number;
  languageDistribution: Record<string, number>;
  departmentReach: Record<string, number>;
  communicationEffectiveness: number;
  emergencyResponseTime: number;
}
