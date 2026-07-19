export type SlaType = 'response' | 'resolution' | 'escalation' | 'approval' | 'custom';

export type SlaStatus = 'on_track' | 'at_risk' | 'breached' | 'paused' | 'met' | 'unknown';

export interface SlaDefinition {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  type: SlaType;
  category: string | null;
  priority: string | null;
  targetMinutes: number;
  warningMinutes: number;
  isActive: boolean;
  workingHoursId: string | null;
  holidayCalendarId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SlaPauseHistory {
  id: string;
  instanceId: string;
  pausedAt: string;
  resumedAt: string | null;
  reason: string | null;
  pausedBy: string | null;
  durationMinutes: number | null;
  createdAt: string;
}

export interface SlaInstance {
  id: string;
  definitionId: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  status: SlaStatus;
  startedAt: string;
  targetAt: string;
  warningAt: string | null;
  completedAt: string | null;
  pausedMinutes: number;
  remainingMinutes: number | null;
  breached: boolean;
  definition?: SlaDefinition;
  pauses: SlaPauseHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface SlaWorkingHours {
  id: string;
  organizationId: string;
  name: string;
  timezone: string;
  schedule: Record<string, { start: string; end: string; enabled: boolean }>;
  createdAt: string;
  updatedAt: string;
}

export interface SlaHolidayCalendar {
  id: string;
  organizationId: string;
  name: string;
  country: string | null;
  holidays: { date: string; name: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface SlaInstanceListParams {
  status?: SlaStatus;
  entityType?: string;
  definitionId?: string;
  breached?: boolean;
  limit?: number;
  offset?: number;
}
