export type CaseStatus = 'open' | 'under_investigation' | 'escalated' | 'pending_review' | 'resolved' | 'closed' | 'archived';
export type CasePriority = 'low' | 'medium' | 'high' | 'critical';
export type CaseSeverity = 'low' | 'medium' | 'high' | 'critical';
export type CaseSource = 'website' | 'qr' | 'email' | 'sms' | 'whatsapp' | 'phone' | 'walk-in' | 'suggestion_box' | 'ngo' | 'union' | 'government';

export interface CaseItem {
  id: string;
  organizationId: string;
  grievanceId: string | null;
  caseNumber: string;
  title: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
  severity: CaseSeverity;
  category: string;
  source: string;
  reporterName: string | null;
  reporterEmail: string | null;
  reporterPhone: string | null;
  reporterAnonymous: boolean;
  factoryId: string | null;
  departmentId: string | null;
  country: string | null;
  assignedTo: string[];
  labels: string[];
  tags: string[];
  dueDate: string | null;
  slaDeadline: string | null;
  riskScore: number;
  mergedInto: string | null;
  duplicateOf: string | null;
  isDeleted: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CaseActivity {
  id: string;
  caseId: string;
  actorId: string | null;
  activityType: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CaseComment {
  id: string;
  caseId: string;
  authorId: string;
  parentId: string | null;
  body: string;
  isInternal: boolean;
  isEdited: boolean;
  editedAt: string | null;
  mentions: string[];
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface InternalNote {
  id: string;
  caseId: string;
  authorId: string;
  title: string;
  body: string;
  isPinned: boolean;
  mentions: string[];
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicResponse {
  id: string;
  caseId: string;
  authorId: string;
  body: string;
  isEdited: boolean;
  editedAt: string | null;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CaseEvidence {
  id: string;
  caseId: string;
  uploadedBy: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  description: string | null;
  category: string | null;
  tags: string[];
  version: number;
  parentEvidenceId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CaseWitness {
  id: string;
  caseId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  statement: string | null;
  isAnonymous: boolean;
  protectionLevel: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CaseInterview {
  id: string;
  caseId: string;
  witnessId: string | null;
  interviewerId: string;
  type: string;
  location: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  summary: string;
  transcript: string | null;
  recordingPath: string | null;
  findings: string | null;
  isConfidential: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CaseFinding {
  id: string;
  caseId: string;
  investigationId: string;
  authorId: string;
  title: string;
  description: string;
  severity: string;
  confidence: string;
  evidenceIds: string[];
  isFinal: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CaseRootCause {
  id: string;
  caseId: string;
  investigationId: string;
  authorId: string;
  category: string;
  description: string;
  contributingFactors: string[];
  verified: boolean;
  verificationMethod: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CaseResolution {
  id: string;
  caseId: string;
  investigationId: string;
  authorId: string;
  type: string;
  description: string;
  actionsTaken: string;
  preventiveMeasures: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
  implementedAt: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  isFinal: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CaseStatusHistory {
  id: string;
  caseId: string;
  changedBy: string | null;
  oldStatus: string | null;
  newStatus: string;
  reason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CaseWatcher {
  id: string;
  caseId: string;
  userId: string;
  createdAt: string;
}

export interface CaseTag {
  id: string;
  caseId: string;
  tag: string;
  color: string;
  createdBy: string | null;
  createdAt: string;
}

export interface CaseLabel {
  id: string;
  caseId: string;
  label: string;
  category: string | null;
  isSystem: boolean;
  createdBy: string | null;
  createdAt: string;
}

export interface CaseLink {
  id: string;
  caseId: string;
  relatedCaseId: string;
  linkType: string;
  createdBy: string | null;
  createdAt: string;
  relatedCase?: { caseNumber: string; title: string; status: string; priority: string };
}

export interface Investigation {
  id: string;
  caseId: string;
  leadInvestigator: string | null;
  status: string;
  scope: string | null;
  methodology: string | null;
  findingsSummary: string | null;
  conclusion: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvestigationAssignment {
  id: string;
  investigationId: string;
  investigatorId: string;
  assignedBy: string | null;
  role: string;
  notes: string | null;
  assignedAt: string;
  unassignedAt: string | null;
}

export interface InvestigationTimeline {
  id: string;
  investigationId: string;
  actorId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface RiskScore {
  id: string;
  caseId: string;
  overallScore: number;
  factors: Record<string, unknown>;
  calculatedBy: string | null;
  calculationMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface EscalationHistory {
  id: string;
  caseId: string;
  ruleId: string | null;
  triggeredBy: string | null;
  escalatedTo: string | null;
  previousAssignee: string | null;
  reason: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface SavedCaseFilter {
  id: string;
  organizationId: string;
  userId: string;
  name: string;
  filters: Record<string, unknown>;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CaseStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

export type { CaseCreateInput, CaseUpdateInput, CommentCreateInput, NoteCreateInput, ResponseCreateInput, EvidenceCreateInput, WitnessCreateInput, InterviewCreateInput, FindingCreateInput, RootCauseCreateInput, ResolutionCreateInput, InvestigationCreateInput, AssignmentCreateInput, LinkCreateInput, FilterCreateInput, EscalationCreateInput } from './module.validation.js';
