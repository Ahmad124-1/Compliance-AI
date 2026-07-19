export type ReportType = 'audit' | 'assessment' | 'finding' | 'capa' | 'worker_voice' | 'executive' | 'compliance' | 'organization' | 'factory' | 'supplier' | 'department' | 'custom';
export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'print';

export interface ReportTemplate {
  id: string;
  organizationId: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  description?: string | null;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportResult {
  id: string;
  title: string;
  type: ReportType;
  format: ReportFormat;
  status: 'ready' | 'queued';
  downloadUrl: string;
  generatedAt: string;
  summary: string;
}
