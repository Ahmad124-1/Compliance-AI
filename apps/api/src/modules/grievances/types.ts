export type GrievanceSource = 'website' | 'qr' | 'email' | 'sms' | 'whatsapp' | 'phone' | 'walk-in' | 'suggestion_box' | 'ngo' | 'union' | 'government';
export type GrievanceStatus = 'pending' | 'under_review' | 'escalated' | 'resolved' | 'closed';
export type GrievancePriority = 'low' | 'medium' | 'high' | 'critical';
export type GrievanceSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Grievance {
  id: string;
  organizationId: string;
  trackingNumber: string;
  trackingPIN: string;
  source: GrievanceSource;
  category: string;
  status: GrievanceStatus;
  priority: GrievancePriority;
  title: string;
  description: string;
  language: string;
  anonymous: boolean;
  reporterName: string | null;
  reporterEmail: string | null;
  reporterPhone: string | null;
  factory: string | null;
  department: string | null;
  location: string | null;
  severity: GrievanceSeverity | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface GrievanceAttachment {
  id: string;
  grievanceId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  createdAt: Date;
}

export interface GrievanceCategory {
  id: string;
  organizationId: string | null;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
}

export interface ComplaintSource {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
}

export interface GrievanceChannel {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Language {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
}

export interface GrievanceCreateInput {
  organizationId: string;
  source: GrievanceSource;
  category: string;
  title: string;
  description: string;
  language?: string;
  anonymous?: boolean;
  reporterName?: string | null;
  reporterEmail?: string | null;
  reporterPhone?: string | null;
  factory?: string | null;
  department?: string | null;
  location?: string | null;
  severity?: GrievanceSeverity | null;
  metadata?: Record<string, unknown>;
}

export interface GrievanceUpdateInput {
  status?: GrievanceStatus;
  priority?: GrievancePriority;
  severity?: GrievanceSeverity | null;
  metadata?: Record<string, unknown>;
}

export interface WorkerPortalConfiguration {
  id: string;
  organizationId: string;
  theme: Record<string, unknown>;
  languages: string[];
  customText: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QRPortal {
  id: string;
  organizationId: string;
  portalUrl: string;
  configuration: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
