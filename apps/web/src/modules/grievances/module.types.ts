export type GrievanceStatus = 'pending' | 'under_review' | 'escalated' | 'resolved' | 'closed';
export type GrievancePriority = 'low' | 'medium' | 'high' | 'critical';
export type GrievanceSeverity = 'low' | 'medium' | 'high' | 'critical';
export type GrievanceSource = 'website' | 'qr' | 'email' | 'sms' | 'whatsapp' | 'phone' | 'walk-in' | 'suggestion_box' | 'ngo' | 'union' | 'government';

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
  createdAt: string;
  updatedAt: string;
}

export interface GrievanceAttachment {
  id: string;
  grievanceId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  createdAt: string;
}

export interface GrievanceCategory {
  id: string;
  organizationId: string | null;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
}

export interface ComplaintSource {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
}

export interface GrievanceChannel {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
}

export interface Language {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface WorkerPortalConfiguration {
  id: string;
  organizationId: string;
  theme: Record<string, unknown>;
  languages: string[];
  customText: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QrPortal {
  id: string;
  organizationId: string;
  portalUrl: string;
  configuration: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QrPortalInput {
  organizationId: string;
  portalUrl: string;
  configuration?: Record<string, unknown>;
}

export interface GrievanceUpdateInput {
  status?: GrievanceStatus;
  priority?: GrievancePriority;
  severity?: GrievanceSeverity | null;
}

export type { GrievanceSubmitInput, GrievanceTrackInput, CategoryCreateInput, PortalConfigInput, QrPortalCreateInput } from './module.validation.js';
