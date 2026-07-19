export type FindingSeverity = 'minor' | 'major' | 'critical' | 'observation' | 'positive_practice' | 'near_miss';
export type FindingStatus = 'open' | 'in_progress' | 'closed' | 'archived';
export type FindingCategory = 'major_finding' | 'minor_finding' | 'critical_finding' | 'observation' | 'opportunity' | 'positive_practice' | 'near_miss' | 'repeat_finding';
export type NonConformityStatus = 'open' | 'assigned' | 'escalated' | 'in_progress' | 'closed' | 'reopened' | 'archived';
export type CAPAStatus = 'draft' | 'open' | 'assigned' | 'in_progress' | 'verification' | 'approval' | 'closed' | 'reopened' | 'archived';
export type CAPAPriority = 'low' | 'medium' | 'high' | 'urgent';
export type CAPAApprovalStatus = 'pending' | 'approved' | 'rejected' | 'requested_more_evidence';
export type RootCauseCategory = 'process' | 'people' | 'equipment' | 'material' | 'environment' | 'management';

export interface FindingRecord {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  category: FindingCategory;
  severity: FindingSeverity;
  status: FindingStatus;
  linkedAuditId: string | null;
  linkedComplaintId: string | null;
  linkedInvestigationId: string | null;
  linkedStandardId: string | null;
  linkedControlId: string | null;
  ownerId: string | null;
  assignedToId: string | null;
  riskRating: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NonConformityRecord {
  id: string;
  organizationId: string;
  findingId: string | null;
  title: string;
  description: string | null;
  status: NonConformityStatus;
  severity: FindingSeverity;
  assignedToId: string | null;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CAPARecord {
  id: string;
  organizationId: string;
  nonConformityId: string | null;
  title: string;
  description: string | null;
  status: CAPAStatus;
  priority: CAPAPriority;
  severity: FindingSeverity;
  risk: string | null;
  ownerId: string | null;
  teamId: string | null;
  dueDate: string | null;
  progress: number;
  dependencies: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CAPATaskRecord {
  id: string;
  capaId: string;
  title: string;
  description: string | null;
  status: string;
  assignedToId: string | null;
  dueDate: string | null;
  progress: number;
  parentTaskId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RootCauseRecord {
  id: string;
  capaId: string;
  category: RootCauseCategory;
  description: string;
  contributingFactors: string[];
  correctiveRecommendation: string | null;
  preventiveRecommendation: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RiskAssessmentRecord {
  id: string;
  capaId: string;
  likelihood: number;
  impact: number;
  severity: string;
  priority: string;
  residualRisk: string | null;
  trend: string | null;
  heatmapData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationChecklistRecord {
  id: string;
  capaId: string;
  title: string;
  completed: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CAPAApprovalRecord {
  id: string;
  capaId: string;
  reviewerType: string;
  reviewerId: string | null;
  status: CAPAApprovalStatus;
  notes: string | null;
  approvedAt: string | null;
  createdAt: string;
}
