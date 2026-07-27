export type UserStatus = 'invited' | 'active' | 'disabled';
export type OrganizationKind = 'consultancy' | 'client';
export type TokenType = 'access' | 'refresh';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  kind: OrganizationKind;
  logoUrl: string | null;
  branding: Record<string, unknown>;
  settings: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Site {
  id: string;
  organizationId: string;
  name: string;
  code: string | null;
  address: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: string;
  organizationId: string;
  siteId: string | null;
  name: string;
  code: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  organizationId: string;
  departmentId: string | null;
  name: string;
  code: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  organizationId: string;
  email: string;
  passwordHash: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  locale: string;
  preferences: Record<string, unknown>;
  status: UserStatus;
  emailVerified: boolean;
  emailVerificationExpiresAt: Date | null;
  passwordResetExpiresAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  key: string;
  resource: string;
  action: string;
  description: string | null;
}

export interface PermissionGroup {
  id: string;
  name: string;
  description: string | null;
}

export interface Role {
  id: string;
  organizationId: string;
  name: string;
  key: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  user: User;
  roles: Role[];
  permissions: Permission[];
  organization: Organization;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: PublicUser;
  organization: Organization;
  roles: string[];
  permissions: string[];
}

export type PublicUser = Omit<User, 'passwordHash'>;

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

export type SlaType = 'response' | 'investigation' | 'resolution' | 'escalation';
export type SlaStatus = 'active' | 'paused' | 'breached' | 'met' | 'cancelled';

export interface SlaDefinition {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  slaType: SlaType;
  priority: string;
  severity: string | null;
  category: string | null;
  targetDurationMinutes: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SlaInstance {
  id: string;
  organizationId: string;
  caseId: string;
  slaDefinitionId: string;
  slaType: SlaType;
  status: SlaStatus;
  startedAt: Date;
  pausedAt: Date | null;
  resumedAt: Date | null;
  deadline: Date;
  metAt: Date | null;
  breachedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SlaPauseHistory {
  id: string;
  slaInstanceId: string;
  reason: string;
  pausedAt: Date;
  resumedAt: Date | null;
  createdAt: Date;
}

export interface SlaWorkingHours {
  id: string;
  organizationId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SlaHolidayCalendar {
  id: string;
  organizationId: string;
  name: string;
  date: string;
  isRecurring: boolean;
  createdAt: Date;
}

export type ConditionType = 'time_sla' | 'priority' | 'severity' | 'category' | 'factory' | 'department' | 'country' | 'organization';
export type ConditionOperator = 'equals' | 'not_equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte';

export interface EscalationLevel {
  id: string;
  organizationId: string;
  name: string;
  level: number;
  description: string | null;
  roleId: string | null;
  notifyRoles: string[];
  autoEscalateAfterMinutes: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EscalationRuleV2 {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  conditionType: ConditionType;
  conditionValue: string;
  conditionOperator: ConditionOperator;
  escalateToLevelId: string | null;
  escalateToRoleId: string | null;
  escalateToUserId: string | null;
  notificationChannels: string[];
  autoEscalate: boolean;
  autoEscalateAfterMinutes: number | null;
  requireApproval: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type QrCodeType = 'organization' | 'factory' | 'department' | 'campaign' | 'poster';

export interface QrCode {
  id: string;
  organizationId: string;
  siteId: string | null;
  departmentId: string | null;
  name: string;
  type: QrCodeType;
  code: string;
  url: string;
  configuration: Record<string, unknown>;
  scanCount: number;
  lastScannedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QrScanEvent {
  id: string;
  organizationId: string;
  qrCodeId: string;
  ipAddress: string | null;
  userAgent: string | null;
  country: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  createdAt: Date;
}

export type WorkerUpdateType = 'status_change' | 'case_update' | 'public_message' | 'additional_info_request' | 'acknowledgement' | 'resolution_notice' | 'case_closed' | 'feedback_request';
export type RecipientType = 'reporter' | 'assigned_to' | 'watchers' | 'all';
export type ActorType = 'system' | 'user' | 'worker';

export interface WorkerStatusUpdate {
  id: string;
  organizationId: string;
  caseId: string;
  updateType: WorkerUpdateType;
  title: string;
  message: string;
  isPublic: boolean;
  isAnonymous: boolean;
  recipientType: RecipientType;
  recipientIds: string[];
  channel: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface WorkerCommunicationTimeline {
  id: string;
  organizationId: string;
  caseId: string;
  actorId: string | null;
  actorType: ActorType;
  action: string;
  description: string;
  metadata: Record<string, unknown>;
  isAnonymous: boolean;
  createdAt: Date;
}

export interface AnalyticsCaseDailySummary {
  id: string;
  organizationId: string;
  siteId: string | null;
  departmentId: string | null;
  summaryDate: string;
  totalCases: number;
  newCases: number;
  closedCases: number;
  openCases: number;
  escalatedCases: number;
  avgResponseTimeMinutes: number | null;
  avgResolutionTimeMinutes: number | null;
  avgSlaComplianceRate: number | null;
  byStatus: Record<string, unknown>;
  byPriority: Record<string, unknown>;
  byCategory: Record<string, unknown>;
  bySource: Record<string, unknown>;
  byCountry: Record<string, unknown>;
  anonymousCases: number;
  namedCases: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsCommunicationDailySummary {
  id: string;
  organizationId: string;
  summaryDate: string;
  channel: string;
  notificationsSent: number;
  notificationsDelivered: number;
  notificationsRead: number;
  notificationsFailed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsSlaDailySummary {
  id: string;
  organizationId: string;
  summaryDate: string;
  slaType: string;
  totalInstances: number;
  metCount: number;
  breachedCount: number;
  pausedCount: number;
  avgTimeToBreachMinutes: number | null;
  complianceRate: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export type QueueJobStatus = 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'dead_letter';

export type { SustainabilityProgram, EsgGoal, SustainabilityKpi, KpiMeasurement, SustainabilityInitiative, InitiativeMilestone, SdgMapping, SustainabilityEvidence, SustainabilityApproval, SustainabilityReport, SustainabilityDashboard } from './sustainability.js';

export interface QueueJob {
  id: string;
  organizationId: string | null;
  queueName: string;
  jobType: string;
  payload: Record<string, unknown>;
  status: QueueJobStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  scheduledAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueJobPayload {
  queueName: string;
  jobType: string;
  payload: Record<string, unknown>;
  priority?: number;
  maxAttempts?: number;
  scheduledAt?: Date;
}

export interface OrganizationCommunicationSettings {
  id: string;
  organizationId: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  branding: Record<string, unknown>;
  emailAddress: string | null;
  smsSenderId: string | null;
  whatsappNumber: string | null;
  hotlineNumber: string | null;
  voiceRecordingEnabled: boolean;
  suggestionBoxEnabled: boolean;
  walkInEnabled: boolean;
  unionChannelEnabled: boolean;
  ngoChannelEnabled: boolean;
  governmentChannelEnabled: boolean;
  mobileAppEnabled: boolean;
  notificationSettings: Record<string, unknown>;
  privacySettings: Record<string, unknown>;
  retentionPolicyDays: number | null;
  createdAt: Date;
  updatedAt: Date;
}
