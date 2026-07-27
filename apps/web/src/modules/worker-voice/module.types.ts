export type GrievanceStatus = 'pending' | 'under_review' | 'escalated' | 'resolved' | 'closed';
export type GrievancePriority = 'low' | 'medium' | 'high' | 'critical';
export type GrievanceSeverity = 'low' | 'medium' | 'high' | 'critical';
export type GrievanceSource = 'website' | 'qr' | 'email' | 'sms' | 'whatsapp' | 'phone' | 'walk-in' | 'suggestion_box' | 'ngo' | 'union' | 'government' | 'worker-voice';

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

export interface WorkerVoiceCase {
  id: string;
  organizationId: string;
  grievanceId: string | null;
  caseNumber: string;
  title: string;
  description: string;
  status: string;
  priority: GrievancePriority;
  severity: GrievanceSeverity;
  category: string;
  source: string;
  reporterName: string | null;
  reporterEmail: string | null;
  reporterPhone: string | null;
  anonymous: boolean;
  factoryId: string | null;
  departmentId: string | null;
  assignedTo: string[];
  dueDate: string | null;
  slaDeadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CaseTrackingInfo {
  caseId: string;
  caseNumber: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  anonymous: boolean;
  timeline: Array<{
    id: string;
    activityType: string;
    description: string;
    createdAt: string;
  }>;
  publicResponses: Array<{
    id: string;
    body: string;
    createdAt: string;
  }>;
  workerUpdates: Array<{
    id: string;
    updateType: string;
    title: string;
    message: string;
    createdAt: string;
  }>;
}

export interface HotlineContact {
  id: string;
  type: 'emergency' | 'compliance' | 'hr' | 'external' | 'ethics';
  name: string;
  phone: string | null;
  email: string | null;
  availableHours: string | null;
  description: string | null;
  is24x7: boolean;
}

export interface EmergencyReport {
  id: string;
  caseId: string;
  caseNumber: string;
  title: string;
  status: string;
  priority: string;
  emergencyType: string;
  createdAt: string;
}

export interface EvidenceItem {
  id: string;
  caseId: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  description: string | null;
  category: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface QRCodeInfo {
  id: string;
  organizationId: string;
  name: string;
  type: string;
  url: string;
  code: string;
  scanCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface WorkerVoiceDashboard {
  organizationId: string;
  openCases: number;
  resolvedCases: number;
  pendingCases: number;
  anonymousCases: number;
  avgResponseTime: number | null;
  categoryBreakdown: Record<string, number>;
  sourceBreakdown: Record<string, number>;
  recentUpdates: Array<{
    id: string;
    caseNumber: string;
    title: string;
    status: string;
    updatedAt: string;
  }>;
}
