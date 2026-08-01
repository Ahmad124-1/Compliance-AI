export interface PolicyRecord {
  id: string;
  organizationId: string;
  title: string;
  type: string;
  content: string;
  version: number;
  status: string;
  approvedBy: string | null;
  approvedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyExport {
  format: string;
  title: string;
  content: string;
  exportedAt: string;
}

