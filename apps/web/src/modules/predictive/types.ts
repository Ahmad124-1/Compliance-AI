export type PredictionType = 'risk_forecast' | 'audit_prediction' | 'capa_prediction' | 'worker_intelligence' | 'supplier_risk' | 'compliance_trend';
export type PredictionCategory = 'factory' | 'department' | 'supplier' | 'worker' | 'audit' | 'capa' | 'compliance' | 'general';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type RecommendationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ScenarioType = 'capa_improvement' | 'response_time' | 'supplier_risk' | 'training_impact' | 'audit_readiness';
export type TrendDirection = 'up' | 'down' | 'stable';
export type TrendMetric = 'compliance_score' | 'audit_readiness' | 'violation_rate' | 'capa_closure_rate' | 'worker_satisfaction' | 'supplier_compliance' | 'training_completion';

export interface PredictionRecord {
  id: string;
  organizationId: string;
  type: PredictionType;
  category: PredictionCategory;
  entityType: string;
  entityId?: string;
  title: string;
  description?: string;
  probability: number;
  confidenceScore: number;
  reasoning?: string;
  suggestedActions: string[];
  riskLevel: RiskLevel;
  timeframe?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PredictionModel {
  id: string;
  organizationId: string;
  name: string;
  type: string;
  version: string;
  accuracy: number;
  precisionScore: number;
  recallScore: number;
  trainingDataCount: number;
  lastTrainedAt?: string;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TrendRecord {
  id: string;
  organizationId: string;
  metric: TrendMetric;
  period: string;
  value: number;
  previousValue?: number;
  changePercent?: number;
  direction: TrendDirection;
  context: Record<string, unknown>;
  computedAt: string;
}

export interface ScenarioSimulation {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  scenarioType: ScenarioType;
  parameters: Record<string, unknown>;
  projectedComplianceScore?: number;
  projectedAuditReadiness?: number;
  projectedViolations?: number;
  projectedImprovement?: number;
  results: Record<string, unknown>;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecommendationRecord {
  id: string;
  organizationId: string;
  type: string;
  priority: RecommendationPriority;
  title: string;
  description?: string;
  expectedImpact?: string;
  reason?: string;
  estimatedEffort?: string;
  status: string;
  actionTaken: boolean;
  actionedBy?: string;
  actionedAt?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ForecastSnapshot {
  id: string;
  organizationId: string;
  forecastType: string;
  horizonDays: number;
  data: Record<string, unknown>;
  computedAt: string;
}

export interface RiskForecastInput {
  organizationId: string;
  timeframe?: string;
  categories?: PredictionCategory[];
}

export interface AuditPredictionInput {
  organizationId: string;
  auditId?: string;
  departmentId?: string;
}

export interface CAPAPredictionInput {
  organizationId: string;
  departmentId?: string;
}

export interface WorkerIntelligenceInput {
  organizationId: string;
  departmentId?: string;
}

export interface SupplierRiskInput {
  organizationId: string;
  supplierId?: string;
}

export interface ComplianceTrendInput {
  organizationId: string;
  metric?: TrendMetric;
  period?: string;
}

export interface ScenarioSimulationInput {
  organizationId: string;
  name: string;
  description?: string;
  scenarioType: ScenarioType;
  parameters: Record<string, unknown>;
  createdBy?: string;
}

export interface RecommendationInput {
  organizationId: string;
  type: string;
  priority?: RecommendationPriority;
  context?: Record<string, unknown>;
}

export interface PredictionStats {
  total: number;
  byType: Record<string, number>;
  byRiskLevel: Record<string, number>;
  avgProbability: number;
  avgConfidence: number;
}

export interface PredictionQuery {
  type?: string;
  category?: string;
  riskLevel?: string;
  limit?: number;
  offset?: number;
}

export interface RunScenarioInput {
  name: string;
  description?: string;
  scenarioType: string;
  parameters: Record<string, unknown>;
  createdBy?: string;
}

export interface GenerateRecommendationsInput {
  type: string;
  priority?: string;
  context?: Record<string, unknown>;
}
