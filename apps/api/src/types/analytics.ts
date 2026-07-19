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
