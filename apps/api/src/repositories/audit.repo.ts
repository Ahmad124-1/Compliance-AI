import { query } from '../db/pool.js';

export type AuditAction =
  | 'complaint.created'
  | 'complaint.updated'
  | 'complaint.status_changed'
  | 'case.assigned'
  | 'case.status_changed'
  | 'evidence.uploaded'
  | 'comment.added'
  | 'notification.sent'
  | 'qr.generated'
  | 'qr.downloaded'
  | 'settings.changed'
  | 'permissions.changed'
  | 'escalation.triggered'
  | 'sla.event'
  | 'search.performed'
  | 'auth.login'
  | 'auth.logout';

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

const mapRow = (r: any): AuditLogRecord => ({
  id: r.id,
  organizationId: r.organization_id,
  actorId: r.actor_id,
  actorType: r.actor_type,
  action: r.action,
  entity: r.entity,
  entityId: r.entity_id,
  description: r.description,
  severity: r.severity,
  ipAddress: r.ip_address,
  userAgent: r.user_agent,
  requestId: r.request_id,
  metadata: r.metadata,
  createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
});

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

export const auditRepo = {
  async list(orgId: string, filters: AuditQueryFilters = {}): Promise<{ logs: AuditLogRecord[]; total: number }> {
    const conditions = ['organization_id = $1'];
    const params: unknown[] = [orgId];
    let i = 2;
    const add = (clause: string, _val: unknown) => {
      conditions.push(clause.replace('$n', `$${i++}`));
    };
    if (filters.actorId) add('actor_id = $n', filters.actorId);
    if (filters.action) add('action = $n', filters.action);
    if (filters.entity) add('entity = $n', filters.entity);
    if (filters.entityId) add('entity_id = $n', filters.entityId);
    if (filters.severity) add('severity = $n', filters.severity);
    if (filters.dateFrom) add('created_at >= $n', filters.dateFrom);
    if (filters.dateTo) add('created_at <= $n', filters.dateTo);

    const where = conditions.join(' AND ');
    const countResult = await query(`SELECT COUNT(*) AS total FROM audit_logs WHERE ${where}`, params);
    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;
    const { rows } = await query(
      `SELECT * FROM audit_logs WHERE ${where} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...params, limit, offset],
    );
    return { logs: rows.map(mapRow), total };
  },

  async get(orgId: string, id: string): Promise<AuditLogRecord | null> {
    const { rows } = await query(`SELECT * FROM audit_logs WHERE organization_id = $1 AND id = $2`, [orgId, id]);
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async actions(orgId: string): Promise<string[]> {
    const { rows } = await query(
      `SELECT DISTINCT action FROM audit_logs WHERE organization_id = $1 ORDER BY action ASC`,
      [orgId],
    );
    return rows.map((r) => r.action);
  },

  async export(orgId: string, filters: AuditQueryFilters = {}): Promise<AuditLogRecord[]> {
    const { logs } = await this.list(orgId, { ...filters, limit: filters.limit ?? 10_000 });
    return logs;
  },
};
