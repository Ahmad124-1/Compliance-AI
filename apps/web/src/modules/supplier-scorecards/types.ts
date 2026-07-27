export type BenchmarkDimension = 'esg_score' | 'carbon_score' | 'compliance_rate' | 'risk_score' | 'environmental_score' | 'social_score' | 'governance_score';
export type TrendDirection = 'improving' | 'declining' | 'stable' | 'volatile';

export interface ScorecardRecord {
  id: string;
  organizationId: string;
  supplierId: string;
  overallEsgScore: number;
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  complianceScore: number;
  carbonScore: number;
  riskScore: number;
  benchmarkComparison: Record<string, unknown>;
  trendAnalysis: TrendData[];
  historicalPerformance: HistoricalDataPoint[];
  assessmentPeriod: string | null;
  scoringDate: string | null;
  nextReviewDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrendData {
  period: string;
  dimension: BenchmarkDimension;
  value: number;
  previousValue: number | null;
  direction: TrendDirection;
  changePercent: number;
}

export interface HistoricalDataPoint {
  date: string;
  period: string;
  overallEsgScore: number;
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  complianceScore: number;
  carbonScore: number;
  riskScore: number;
}

export interface BenchmarkResult {
  supplierId: string;
  supplierName: string;
  overallEsgScore: number;
  percentile: number;
  rank: number;
  totalSuppliers: number;
  dimensionScores: Record<BenchmarkDimension, number>;
}

export interface ScorecardSummary {
  id: string;
  supplierId: string;
  supplierName: string;
  overallEsgScore: number;
  rank: number;
  trendDirection: TrendDirection;
  assessmentPeriod: string | null;
  scoringDate: string | null;
}