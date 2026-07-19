export const SLA_ENDPOINTS = {
  definitions: '/api/v1/sla/definitions',
  definition: (id: string) => `/api/v1/sla/definitions/${id}`,
  definitionDelete: (id: string) => `/api/v1/sla/definitions/${id}`,
  instances: '/api/v1/sla/instances',
  instance: (id: string) => `/api/v1/sla/instances/${id}`,
  pause: (id: string) => `/api/v1/sla/instances/${id}/pause`,
  resume: (id: string) => `/api/v1/sla/instances/${id}/resume`,
  workingHours: '/api/v1/sla/working-hours',
  workingHour: (id: string) => `/api/v1/sla/working-hours/${id}`,
  holidayCalendars: '/api/v1/sla/holiday-calendars',
  holidayCalendar: (id: string) => `/api/v1/sla/holiday-calendars/${id}`,
} as const;

export const SLA_ROUTES = {
  definitions: '/sla',
  definitionDetail: (id: string) => `/sla/${id}`,
  instances: '/sla/instances',
  workingHours: '/sla/working-hours',
} as const;

export const SLA_TYPE_LABELS: Record<string, string> = {
  response: 'Response',
  resolution: 'Resolution',
  escalation: 'Escalation',
  approval: 'Approval',
  custom: 'Custom',
};

export const SLA_STATUS_LABELS: Record<string, string> = {
  on_track: 'On Track',
  at_risk: 'At Risk',
  breached: 'Breached',
  paused: 'Paused',
  met: 'Met',
  unknown: 'Unknown',
};

export const SLA_DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};
