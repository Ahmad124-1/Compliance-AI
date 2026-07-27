export type SustainabilityCategory =
  | 'net_zero'
  | 'water'
  | 'waste'
  | 'wellbeing'
  | 'renewable_energy'
  | 'supply_chain'
  | 'esg_transformation'
  | 'general';

export type SustainabilityStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type SustainabilityPriority = 'low' | 'medium' | 'high' | 'critical';
export type EspPillar = 'environment' | 'social' | 'governance';
export type GoalStatus = 'not_started' | 'in_progress' | 'at_risk' | 'achieved' | 'paused' | 'archived';
export type GoalConfidence = 'low' | 'medium' | 'high';
export type GoalRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type KpiType = 'numeric' | 'percentage' | 'ratio' | 'currency' | 'intensity' | 'count' | 'boolean';
export type KpiFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type KpiAggregation = 'latest' | 'sum' | 'avg' | 'min' | 'max' | 'count';
export type InitiativeStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled' | 'archived';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
export type EvidenceType = 'policy' | 'invoice' | 'utility_bill' | 'audit_report' | 'certificate' | 'photo' | 'training_record' | 'contract' | 'esg_evidence' | 'other';
export type ApprovalStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'archived';
export type ReportType = 'progress' | 'goal_status' | 'sdg_contribution' | 'kpi_performance' | 'initiative_status' | 'executive_summary';
export type ReportFormat = 'pdf' | 'xlsx' | 'docx';
export type ReportStatus = 'draft' | 'generated' | 'archived';

export interface SustainabilityProgram {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  category: SustainabilityCategory;
  ownerId: string | null;
  departmentId: string | null;
  startDate: string | null;
  endDate: string | null;
  status: SustainabilityStatus;
  budget: number | null;
  priority: SustainabilityPriority;
  linkedStandards: Record<string, unknown>[];
  linkedSdgs: number[];
  linkedEsgPillars: string[];
  evidenceCount: number;
  attachmentCount: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EsgGoal {
  id: string;
  organizationId: string;
  programId: string | null;
  name: string;
  description: string | null;
  esgPillar: EspPillar;
  baseline: number | null;
  targetValue: number;
  unit: string;
  currentValue: number | null;
  deadline: string | null;
  ownerId: string | null;
  progressPct: number;
  status: GoalStatus;
  confidence: GoalConfidence;
  riskLevel: GoalRiskLevel;
  linkedSdgs: number[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SustainabilityKpi {
  id: string;
  organizationId: string;
  programId: string | null;
  goalId: string | null;
  initiativeId: string | null;
  name: string;
  description: string | null;
  kpiType: KpiType;
  frequency: KpiFrequency;
  unit: string;
  targetValue: number | null;
  baselineValue: number | null;
  thresholdWarning: number | null;
  thresholdCritical: number | null;
  aggregation: KpiAggregation;
  departmentId: string | null;
  facilityId: string | null;
  ownerId: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KpiMeasurement {
  id: string;
  organizationId: string;
  kpiId: string;
  value: number;
  recordedAt: string;
  recordedBy: string | null;
  source: string | null;
  notes: string | null;
  departmentId: string | null;
  facilityId: string | null;
  createdAt: string;
}

export interface SustainabilityInitiative {
  id: string;
  organizationId: string;
  programId: string | null;
  name: string;
  description: string | null;
  ownerId: string | null;
  team: string;
  startDate: string | null;
  dueDate: string | null;
  budget: number | null;
  expectedImpact: string | null;
  actualImpact: string | null;
  status: InitiativeStatus;
  milestonesCount: number;
  evidenceCount: number;
  riskLevel: GoalRiskLevel;
  linkedSdgs: number[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InitiativeMilestone {
  id: string;
  organizationId: string;
  initiativeId: string;
  name: string;
  description: string | null;
  dueDate: string | null;
  completionDate: string | null;
  status: MilestoneStatus;
  ownerId: string | null;
  evidenceCount: number;
  sortOrder: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SdgMapping {
  id: string;
  organizationId: string;
  sdgId: number;
  entityType: string;
  entityId: string;
  contributionPct: number;
  description: string | null;
  isDeleted: boolean;
  createdAt: string;
}

export interface SustainabilityEvidence {
  id: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  documentId: string | null;
  title: string;
  description: string | null;
  evidenceType: EvidenceType;
  tags: string[];
  version: number;
  expiryDate: string | null;
  approvalStatus: ApprovalStatus;
  uploadedBy: string | null;
  aiExtractedData: Record<string, unknown>;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SustainabilityApproval {
  id: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  status: ApprovalStatus;
  submittedBy: string | null;
  reviewerId: string | null;
  comments: string | null;
  dueDate: string | null;
  completedAt: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SustainabilityReport {
  id: string;
  organizationId: string;
  programId: string | null;
  name: string;
  description: string | null;
  reportType: ReportType;
  format: ReportFormat;
  generatedBy: string | null;
  status: ReportStatus;
  fileUrl: string | null;
  summary: string | null;
  params: Record<string, unknown>;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SustainabilityDashboard {
  totalPrograms: number;
  activePrograms: number;
  totalGoals: number;
  achievedGoals: number;
  goalsInProgress: number;
  totalKpis: number;
  kpisAtRisk: number;
  totalInitiatives: number;
  initiativesCompleted: number;
  initiativesOnTrack: number;
  esgPillarDistribution: Record<EspPillar, number>;
  sdgContribution: Record<number, number>;
  progressPct: number;
}