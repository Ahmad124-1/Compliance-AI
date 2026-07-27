export type SupplierCertificationType = 'iso_14001' | 'iso_45001' | 'iso_9001' | 'sa8000' | 'smeta' | 'bsci' | 'wrap' | 'fsc' | 'fairtrade' | 'rainforest_alliance' | 'organic' | 'custom';
export type SupplierCertStatus = 'active' | 'expired' | 'pending_renewal' | 'revoked' | 'suspended';
export type SupplierVerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired';

export interface SupplierCertificationRecord {
  id: string;
  organizationId: string;
  supplierId: string;
  certificationName: string;
  certificationType: SupplierCertificationType;
  certificationBody: string | null;
  certificateNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  renewalDate: string | null;
  status: SupplierCertStatus;
  verificationStatus: SupplierVerificationStatus;
  evidence: Record<string, unknown>[];
  scope: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierCertificationRenewal {
  id: string;
  certificationId: string;
  renewalDate: string;
  status: 'pending' | 'scheduled' | 'completed' | 'overdue';
  notes: string | null;
  createdAt: string;
}

export interface SupplierCertificationSummary {
  id: string;
  supplierId: string;
  supplierName: string;
  certificationName: string;
  certificationType: SupplierCertificationType;
  status: SupplierCertStatus;
  verificationStatus: SupplierVerificationStatus;
  expiryDate: string | null;
  daysToExpiry: number | null;
  certificationBody: string | null;
}

export interface SupplierCertificationAuditResult {
  certificationId: string;
  certificationName: string;
  certificationType: SupplierCertificationType;
  auditDate: string | null;
  auditorName: string | null;
  result: 'pass' | 'conditional_pass' | 'fail' | 'not_audited';
  findings: string[];
  nextAuditDate: string | null;
}