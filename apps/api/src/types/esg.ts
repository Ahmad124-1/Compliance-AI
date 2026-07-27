export type EsgPillar = 'environmental' | 'social' | 'governance';
export type FrameworkCode = 'gri' | 'sasb' | 'tcfd' | 'csrd' | 'cdp' | 'djsi' | 'mSCI' | 'custom';
export type MetricDataType = 'numeric' | 'percentage' | 'currency' | 'boolean' | 'text' | 'date' | 'json';
export type MetricFrequency = 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'event_based' | 'continuous';
export type PeriodType = 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'custom';
export type PeriodStatus = 'upcoming' | 'open' | 'closed' | 'extended' | 'finalized';
export type DisclosureStatus = 'draft' | 'in_review' | 'approved' | 'rejected' | 'published' | 'archived';
export type AssuranceStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';
export type AssuranceType = 'internal' | 'external' | 'limited' | 'reasonable' | 'peer_review' | 'third_party';
export type AssuranceOpinion = 'clean' | 'qualified' | 'adverse' | 'disclaimer' | 'not_applicable';
export type ReportType = 'comprehensive' | 'sustainability' | 'climate' | 'social' | 'governance' | 'regulatory_filing' | 'executive_summary' | 'stakeholder' | 'custom';
export type ReportFormat = 'pdf' | 'xlsx' | 'docx' | 'json' | 'html';
export type ReportStatus = 'draft' | 'generating' | 'completed' | 'approved' | 'published' | 'archived' | 'failed';
export type FinancialImpact = 'high' | 'medium' | 'low' | 'negligible';

export interface EsgFramework {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  frameworkCode: FrameworkCode;
  version: string;
  issuingBody: string | null;
  effectiveDate: string | null;
  categories: Record<string, unknown>[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EsgMetric {
  id: string;
  organizationId: string;
  frameworkId: string | null;
  name: string;
  description: string | null;
  metricCode: string;
  category: string;
  pillar: EsgPillar;
  unit: string | null;
  dataType: MetricDataType;
  reportingFrequency: MetricFrequency;
  applicableFacilities: string[];
  applicableDepartments: string[];
  calculationMethod: string | null;
  thresholdWarning: number | null;
  thresholdCritical: number | null;
  targetValue: number | null;
  baselineValue: number | null;
  evidenceRequired: boolean;
  verificationRequired: boolean;
  isMandatory: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EsgReportingPeriod {
  id: string;
  organizationId: string;
  name: string;
  periodType: PeriodType;
  startDate: string;
  endDate: string;
  dueDate: string;
  status: PeriodStatus;
  frameworks: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EsgDataPoint {
  id: string;
  organizationId: string;
  metricId: string;
  periodId: string;
  facilityId: string | null;
  departmentId: string | null;
  value: number;
  valueText: string | null;
  valueJson: Record<string, unknown>;
  unit: string | null;
  confidenceScore: number | null;
  isVerified: boolean;
  verifiedBy: string | null;
  verifiedAt: string | null;
  sourceSystem: string | null;
  sourceReference: string | null;
  notes: string | null;
  recordedBy: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EsgMaterialityTopic {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  category: string;
  pillar: EsgPillar;
  externalDrivers: string[];
  internalDrivers: string[];
  stakeholderGroups: string[];
  impactScore: number | null;
  likelihoodScore: number | null;
  financialImpact: FinancialImpact | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EsgMaterialityAssessment {
  id: string;
  organizationId: string;
  topicId: string;
  periodId: string;
  impactScore: number;
  likelihoodScore: number;
  stakeholderPriority: number | null;
  financialMateriality: boolean;
  impactMateriality: boolean;
  overallPriorityScore: number | null;
  justification: string | null;
  assessedBy: string | null;
  approved: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EsgDisclosure {
  id: string;
  organizationId: string;
  frameworkId: string | null;
  metricId: string | null;
  periodId: string;
  name: string;
  description: string | null;
  category: string;
  pillar: EsgPillar;
  status: DisclosureStatus;
  content: Record<string, unknown>;
  summary: string | null;
  pageReference: string | null;
  linkedDocuments: string[];
  dataPoints: string[];
  assuranceStatus: AssuranceStatus;
  submittedBy: string | null;
  submittedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  publishedAt: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EsgReport {
  id: string;
  organizationId: string;
  periodId: string;
  name: string;
  description: string | null;
  reportType: ReportType;
  format: ReportFormat;
  status: ReportStatus;
  fileUrl: string | null;
  fileSizeBytes: number | null;
  pagesCount: number | null;
  summary: string | null;
  params: Record<string, unknown>;
  generatedBy: string | null;
  generatedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  publishedAt: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EsgAssurance {
  id: string;
  organizationId: string;
  reportId: string | null;
  disclosureId: string | null;
  assuranceType: AssuranceType;
  scopeDescription: string;
  providerName: string | null;
  providerEmail: string | null;
  assuranceDate: string | null;
  status: AssuranceStatus;
  findings: Record<string, unknown>[];
  conclusion: string | null;
  opinionType: AssuranceOpinion | null;
  evidenceReferences: string[];
  assignedTo: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EsgDashboard {
  totalFrameworks: number;
  activeFrameworks: number;
  totalMetrics: number;
  totalPeriods: number;
  openPeriods: number;
  totalDisclosures: number;
  publishedDisclosures: number;
  disclosuresInReview: number;
  totalReports: number;
  publishedReports: number;
  pillarDistribution: Record<EsgPillar, number>;
  disclosureCompletionPct: number;
  assuranceCompletionPct: number;
}
