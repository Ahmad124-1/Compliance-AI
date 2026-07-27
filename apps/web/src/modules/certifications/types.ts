export type CertificationType = 'iso_14001' | 'iso_45001' | 'iso_9001' | 'sa8000' | 'smeta' | 'bsci' | 'wrap' | 'fsc' | 'fairtrade' | 'rainforest_alliance' | 'organic' | 'custom';
export type CertificationStatus = 'active' | 'expired' | 'pending_renewal' | 'revoked' | 'suspended';
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired';

export interface CertificationRecord {
  id: string;
  organizationId: string;
  supplierId: string;
  certificationName: string;
  certificationType: CertificationType;
  certificationBody: string | null;
  certificateNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  renewalDate: string | null;
  status: CertificationStatus;
  verificationStatus: VerificationStatus;
  evidence: Record<string, unknown>[];
  scope: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CertificationSummary {
  id: string;
  supplierId: string;
  supplierName: string;
  certificationName: string;
  certificationType: CertificationType;
  status: CertificationStatus;
  verificationStatus: VerificationStatus;
  expiryDate: string | null;
  daysToExpiry: number | null;
  certificationBody: string | null;
}