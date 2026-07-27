export type SupplierAuditType = 'desktop' | 'remote' | 'onsite' | 'third_party' | 'follow_up';
export type SupplierAuditStatus = 'planned' | 'in_progress' | 'completed' | 'follow_up_required' | 'cancelled';
export type SupplierFindingSeverity = 'critical' | 'major' | 'minor' | 'observation' | 'positive_practice';
export type SupplierFindingStatus = 'open' | 'in_progress' | 'closed' | 'archived';
export type SupplierCapaStatus = 'open' | 'assigned' | 'in_progress' | 'verification' | 'approval' | 'closed' | 'reopened';
export type SupplierApprovalStatus = 'pending' | 'approved' | 'rejected' | 'requested_more_evidence';

export interface AuditFinding {
  id: string;
  title: string;
  description: string;
  severity: SupplierFindingSeverity;
  status: SupplierFindingStatus;
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
  status: SupplierCapaStatus;
  dueDate: string | null;
  ownerId: string | null;
  ownerName: string | null;
}

export interface AuditApproval {
  id: string;
  reviewerType: string;
  reviewerId: string | null;
  reviewerName: string | null;
  status: SupplierApprovalStatus;
  notes: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface SupplierAuditRecord {
  id: string;
  organizationId: string;
  supplierId: string;
  title: string;
  description: string | null;
  auditType: SupplierAuditType;
  status: SupplierAuditStatus;
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

export interface SupplierAuditSummary {
  id: string;
  supplierId: string;
  supplierName: string;
  title: string;
  auditType: SupplierAuditType;
  status: SupplierAuditStatus;
  findingCount: number;
  openFindings: number;
  auditorName: string | null;
  auditDate: string | null;
  createdAt: string;
}