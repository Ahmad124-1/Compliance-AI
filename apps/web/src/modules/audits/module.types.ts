export interface AuditSummary {
  id: string;
  auditNumber: string;
  title: string;
  status: string;
  auditType: string;
  progress: number;
  auditorId: string | null;
  dueDate: string | null;
  createdAt: string;
}

export interface AuditWorkspaceView {
  audit: AuditSummary;
  sections: Array<{ id: string; title: string; progress: number; isCompleted: boolean }>;
  progress: { completionPercentage: number; overallProgress: number; sectionProgress: number; questionProgress: number };
}
