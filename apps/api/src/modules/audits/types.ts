export type AuditType =
  | 'internal'
  | 'supplier'
  | 'factory'
  | 'smeta'
  | 'sa8000'
  | 'iso'
  | 'customer'
  | 'surveillance'
  | 'follow_up'
  | 'special_investigation'
  | 'environmental'
  | 'health_safety'
  | 'custom';

export type AuditStatus = 'draft' | 'scheduled' | 'in_progress' | 'paused' | 'completed' | 'cancelled' | 'reopened' | 'overdue';
export type AuditExecutionStatus = 'not_started' | 'in_progress' | 'paused' | 'completed';
export type ObservationSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FindingType = 'major' | 'minor' | 'observation' | 'opportunity' | 'critical' | 'non_conformity';
export type FindingPriority = 'low' | 'medium' | 'high' | 'urgent';
export type FindingStatus = 'open' | 'in_progress' | 'closed' | 'accepted' | 'rejected';
export type EvidenceType = 'photo' | 'video' | 'audio' | 'document';
export type InterviewType = 'worker' | 'management' | 'contractor' | 'anonymous';

export interface AuditRecord {
  id: string;
  organizationId: string;
  auditNumber: string;
  title: string;
  auditType: AuditType;
  status: AuditStatus;
  templateId: string | null;
  factoryId: string | null;
  supplierId: string | null;
  organizationUnitId: string | null;
  auditorId: string | null;
  leadAuditorId: string | null;
  scheduledStartDate: string | null;
  scheduledEndDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  dueDate: string | null;
  progress: number;
  riskRating: string | null;
  description: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AuditSectionRecord {
  id: string;
  auditId: string;
  sourceSectionId: string | null;
  title: string;
  description: string | null;
  position: number;
  progress: number;
  isRequired: boolean;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditQuestionResponseRecord {
  id: string;
  auditId: string;
  auditSectionId: string | null;
  questionId: string | null;
  sourceQuestionId: string | null;
  questionLabel: string;
  answerType: string;
  responseText: string | null;
  responseJson: Record<string, unknown>;
  selectedValues: string[];
  comments: string | null;
  score: number | null;
  isRequired: boolean;
  isCompleted: boolean;
  isSkipped: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditObservationRecord {
  id: string;
  auditId: string;
  observationType: string;
  severity: ObservationSeverity;
  category: string | null;
  description: string;
  recommendation: string | null;
  linkedStandardId: string | null;
  linkedRequirementId: string | null;
  linkedControlId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditFindingRecord {
  id: string;
  auditId: string;
  observationId: string | null;
  findingType: FindingType;
  severity: ObservationSeverity;
  priority: FindingPriority;
  status: FindingStatus;
  riskRating: string | null;
  title: string;
  description: string | null;
  recommendation: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvidenceRecord {
  id: string;
  auditId: string;
  evidenceType: EvidenceType;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  gpsLocation: string | null;
  observedAt: string | null;
  fileName: string | null;
  storageKey: string | null;
  previewUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditInterviewRecord {
  id: string;
  auditId: string;
  interviewType: InterviewType;
  subjectName: string | null;
  title: string;
  summary: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditSignatureRecord {
  id: string;
  auditId: string;
  signerType: string;
  signerName: string;
  signatureData: string | null;
  signedAt: string | null;
  verified: boolean;
  createdAt: string;
}

export interface AuditCalendarRecord {
  id: string;
  auditId: string;
  calendarDate: string;
  viewType: string;
  title: string;
  details: string | null;
  createdAt: string;
}

export interface AuditReminderRecord {
  id: string;
  auditId: string;
  reminderAt: string;
  message: string;
  sent: boolean;
  createdAt: string;
}

export interface AuditProgressRecord {
  id: string;
  auditId: string;
  overallProgress: number;
  sectionProgress: number;
  questionProgress: number;
  completionPercentage: number;
  estimatedRemainingMinutes: number | null;
  updatedAt: string;
}

export interface AuditStatusHistoryRecord {
  id: string;
  auditId: string;
  status: AuditStatus;
  note: string | null;
  createdAt: string;
}
