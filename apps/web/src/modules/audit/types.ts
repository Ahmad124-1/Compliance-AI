export type AuditSeverity = 'info' | 'warning' | 'critical';
export type AuditActorType = 'user' | 'system' | 'worker';

export interface AuditLogRecord {
  id: string;
  organizationId: string | null;
  actorId: string | null;
  actorType: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  description: string | null;
  severity: string;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AuditQueryFilters {
  actorId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  severity?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface AuditListResponse {
  logs: AuditLogRecord[];
  total: number;
}
