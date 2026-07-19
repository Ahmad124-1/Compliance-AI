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
