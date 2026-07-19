export interface Kpis {
  totalCases: number;
  openCases: number;
  closedCases: number;
  escalatedCases: number;
  avgResponseTimeMinutes: number;
  avgResolutionTimeMinutes: number;
  avgSlaComplianceRate: number;
}

export interface TrendPoint {
  period: string;
  count: number;
}

export interface HeatmapCell {
  dayOfWeek: number;
  hour: number;
  count: number;
}

export interface CaseAnalytics {
  totalCases?: number;
  total?: number;
  openCases?: number;
  closedCases?: number;
  escalatedCases?: number;
  avgResponseTimeMinutes?: number;
  avgResolutionTimeMinutes?: number;
  avgSlaComplianceRate?: number;
  byStatus?: Record<string, number>;
  byPriority?: Record<string, number>;
  byCategory?: Record<string, number>;
  bySource?: Record<string, number>;
}

export interface DistributionEntry {
  key: string;
  count: number;
}
