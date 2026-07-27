export type AssessmentCategory = 'environmental' | 'social' | 'governance' | 'health_safety' | 'ethics' | 'responsible_sourcing' | 'labor_rights' | 'human_rights' | 'anti_corruption' | 'data_privacy';
export type AssessmentStatus = 'draft' | 'in_progress' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'requested_changes';

export interface AssessmentQuestion {
  id: string;
  question: string;
  category: AssessmentCategory;
  weight: number;
  maxScore: number;
  evidenceRequired: boolean;
}

export interface AssessmentAnswer {
  questionId: string;
  score: number;
  maxScore: number;
  evidence: string | null;
  notes: string | null;
}

export interface AssessmentScoring {
  overallScore: number;
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  healthSafetyScore: number;
  categoryScores: Record<string, number>;
  maxPossibleScore: number;
  percentage: number;
}

export interface AssessmentRecord {
  id: string;
  organizationId: string;
  supplierId: string;
  title: string;
  description: string | null;
  category: AssessmentCategory;
  questions: AssessmentQuestion[];
  answers: AssessmentAnswer[];
  evidence: Record<string, unknown>[];
  scoring: AssessmentScoring;
  reviewerId: string | null;
  reviewerName: string | null;
  approvalStatus: ApprovalStatus;
  approvedById: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  history: AssessmentHistoryRecord[];
  dueDate: string | null;
  completedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentHistoryRecord {
  id: string;
  assessmentId: string;
  action: string;
  actorId: string | null;
  actorName: string | null;
  details: string | null;
  createdAt: string;
}

export interface AssessmentSummary {
  id: string;
  supplierId: string;
  supplierName: string;
  category: AssessmentCategory;
  overallScore: number;
  status: AssessmentStatus;
  approvalStatus: ApprovalStatus;
  reviewerName: string | null;
  createdAt: string;
  updatedAt: string;
}