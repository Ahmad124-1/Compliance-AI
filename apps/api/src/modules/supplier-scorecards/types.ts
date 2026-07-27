export type SupplierScorecardPeriod = 'quarterly' | 'semi_annual' | 'annual' | 'custom';
export type SupplierBenchmarkDimension = 'esg_score' | 'carbon_score' | 'compliance_rate' | 'risk_score' | 'environmental_score' | 'social_score' | 'governance_score';
export type SupplierTrendDirection = 'improving' | 'declining' | 'stable' | 'volatile';

export interface SupplierScorecardRecord {
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
  trendAnalysis: SupplierTrendData[];
  historicalPerformance: SupplierHistoricalDataPoint[];
  assessmentPeriod: string | null;
  scoringDate: string | null;
  nextReviewDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierTrendData {
  period: string;
  dimension: SupplierBenchmarkDimension;
  value: number;
  previousValue: number | null;
  direction: SupplierTrendDirection;
  changePercent: number;
}

export interface SupplierHistoricalDataPoint {
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

export interface SupplierBenchmarkResult {
  supplierId: string;
  supplierName: string;
  overallEsgScore: number;
  percentile: number;
  rank: number;
  totalSuppliers: number;
  dimensionScores: Record<SupplierBenchmarkDimension, number>;
}

export interface SupplierScorecardSummary {
  id: string;
  supplierId: string;
  supplierName: string;
  overallEsgScore: number;
  rank: number;
  trendDirection: SupplierTrendDirection;
  assessmentPeriod: string | null;
  scoringDate: string | null;
}