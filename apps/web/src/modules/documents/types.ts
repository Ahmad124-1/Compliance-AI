export interface DocumentRecord {
  id: string;
  organizationId: string;
  uploadedBy: string | null;
  filename: string;
  contentType: string;
  sizeBytes: number;
  extractedText: string | null;
  metadata: Record<string, unknown>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentAnalysis {
  documentId: string;
  action: string;
  result: string;
  provider: string;
  model: string;
  analyzedAt: string;
}

