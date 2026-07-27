export type AuditType = 'desktop' | 'remote' | 'onsite' | 'third_party' | 'follow_up';
export type AuditStatus = 'planned' | 'in_progress' | 'completed' | 'follow_up_required' | 'cancelled';
export type FindingSeverity = 'critical' | 'major' | 'minor' | 'observation' | 'positive_practice';
export type FindingStatus = 'open' | 'in_progress' | 'closed' | 'archived';
export type CapaStatus = 'open' | 'assigned' | 'in_progress' | 'verification' | 'approval' | 'closed' | 'reopened';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'requested_more_evidence';

export interface AuditFinding {
  id: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  status: FindingStatus;
  evidence: string[];
  photos: string[];
  documents: string[];
  capas: string[];
  assignedToId: string | null;
  assignedToName: string | null;
  dueDate: string | null;
}

export interface AuditEvidence {
  id: string;
  title: string;
  type: string;
  url: string | null;
  description: string | null;
  uploadedBy: string | null;
  uploadedByName: string | null;
  createdAt: string;
}

export interface AuditPhoto {
  id: string;
  url: string;
  caption: string | null;
  uploadedBy: string | null;
  uploadedByName: string | null;
  createdAt: string;
}

export interface AuditDocument {
  id: string;
  title: string;
  documentType: string;
  url: string | null;
  description: string | null;
  uploadedBy: string | null;
  uploadedByName: string | null;
  createdAt: string;
}

export interface AuditCapa {
  id: string;
  capaId: string;
  title: string;
  status: CapaStatus;
  dueDate: string | null;
  ownerId: string | null;
  ownerName: string | null;
}

export interface AuditApproval {
  id: string;
  reviewerType: string;
  reviewerId: string | null;
  reviewerName: string | null;
  status: ApprovalStatus;
  notes: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface AuditRecord {
  id: string;
  organizationId: string;
  supplierId: string;
  title: string;
  description: string | null;
  auditType: AuditType;
  status: AuditStatus;
  findings: AuditFinding[];
  evidence: AuditEvidence[];
  photos: AuditPhoto[];
  documents: AuditDocument[];
  capas: AuditCapa[];
  approvals: AuditApproval[];
  auditorId: string | null;
  auditorName: string | null;
  auditDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  version: number;
  history: AuditHistoryRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditHistoryRecord {
  id: string;
  auditId: string;
  action: string;
  actorId: string | null;
  actorName: string | null;
  details: string | null;
  createdAt: string;
}

export interface AuditSummary {
  id: string;
  supplierId: string;
  supplierName: string;
  title: string;
  auditType: AuditType;
  status: AuditStatus;
  findingCount: number;
  openFindings: number;
  auditorName: string | null;
  auditDate: string | null;
  createdAt: string;
}