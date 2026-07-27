import { query } from '../db/pool.js';

function mapEmergencyAlert(row: any) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    senderId: row.sender_id,
    title: row.title,
    body: row.body,
    alertType: row.alert_type,
    priority: row.priority,
    severity: row.severity,
    scope: row.scope ?? {},
    channels: row.channels ?? [],
    instructions: row.instructions,
    requiresAcknowledgement: row.requires_acknowledgement,
    escalationEnabled: row.escalation_enabled,
    escalationAfterMinutes: row.escalation_after_minutes,
    isActive: row.is_active,
    expiresAt: row.expires_at,
    acknowledgedCount: row.acknowledged_count,
    totalRecipients: row.total_recipients,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEmergencyAcknowledgement(row: any) {
  return {
    id: row.id,
    emergencyAlertId: row.emergency_alert_id,
    organizationId: row.organization_id,
    userId: row.user_id,
    status: row.status,
    note: row.note,
    location: row.location ?? {},
    acknowledgedAt: row.acknowledged_at,
    createdAt: row.created_at,
  };
}

export const emergencyAlertRepo = {
  async create(input: {
    organizationId: string;
    senderId?: string;
    title: string;
    body: string;
    alertType: string;
    priority?: string;
    severity?: string;
    scope?: Record<string, unknown>;
    channels?: string[];
    instructions?: string;
    requiresAcknowledgement?: boolean;
    escalationEnabled?: boolean;
    escalationAfterMinutes?: number;
    totalRecipients?: number;
    expiresAt?: string;
  }) {
    const { rows } = await query(
      `INSERT INTO emergency_alerts (organization_id, sender_id, title, body, alert_type, priority, severity, scope, channels, instructions, requires_acknowledgement, escalation_enabled, escalation_after_minutes, total_recipients, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        input.organizationId,
        input.senderId ?? null,
        input.title,
        input.body,
        input.alertType,
        input.priority ?? 'critical',
        input.severity ?? 'high',
        input.scope ?? {},
        input.channels ?? ['in_app', 'push', 'sms'],
        input.instructions ?? null,
        input.requiresAcknowledgement ?? true,
        input.escalationEnabled ?? true,
        input.escalationAfterMinutes ?? 5,
        input.totalRecipients ?? 0,
        input.expiresAt ?? null,
      ],
    );
    return mapEmergencyAlert(rows[0]);
  },

  async findById(id: string) {
    const { rows } = await query(`SELECT * FROM emergency_alerts WHERE id = $1`, [id]);
    return rows[0] ? mapEmergencyAlert(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filters: { alertType?: string; isActive?: boolean; limit?: number; offset?: number } = {}) {
    const conditions = ['organization_id = $1'];
    const params: any[] = [orgId];
    let i = 2;
    if (filters.alertType) { conditions.push(`alert_type = $${i++}`); params.push(filters.alertType); }
    if (filters.isActive !== undefined) { conditions.push(`is_active = $${i++}`); params.push(filters.isActive); }
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;
    const { rows } = await query(`SELECT * FROM emergency_alerts WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`, [...params, limit, offset]);
    return rows.map(mapEmergencyAlert);
  },

  async updateAcknowledgementCount(id: string, count: number) {
    const { rows } = await query(`UPDATE emergency_alerts SET acknowledged_count = $1, updated_at = now() WHERE id = $2 RETURNING *`, [count, id]);
    return rows[0] ? mapEmergencyAlert(rows[0]) : null;
  },

  async deactivate(id: string) {
    const { rows } = await query(`UPDATE emergency_alerts SET is_active = false, updated_at = now() WHERE id = $1 RETURNING *`, [id]);
    return rows[0] ? mapEmergencyAlert(rows[0]) : null;
  },

  async delete(id: string) {
    await query(`DELETE FROM emergency_alerts WHERE id = $1`, [id]);
  },
};

export const emergencyAcknowledgementRepo = {
  async create(input: { emergencyAlertId: string; organizationId: string; userId?: string; status?: string; note?: string; location?: Record<string, unknown> }) {
    const { rows } = await query(
      `INSERT INTO emergency_acknowledgements (emergency_alert_id, organization_id, user_id, status, note, location) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [input.emergencyAlertId, input.organizationId, input.userId ?? null, input.status ?? 'acknowledged', input.note ?? null, input.location ?? {}],
    );
    return mapEmergencyAcknowledgement(rows[0]);
  },

  async listByAlert(emergencyAlertId: string) {
    const { rows } = await query(`SELECT * FROM emergency_acknowledgements WHERE emergency_alert_id = $1 ORDER BY acknowledged_at DESC`, [emergencyAlertId]);
    return rows.map(mapEmergencyAcknowledgement);
  },

  async findByUser(orgId: string, userId: string, alertId?: string) {
    const conditions = ['organization_id = $1', 'user_id = $2'];
    const params: any[] = [orgId, userId];
    let i = 3;
    if (alertId) { conditions.push(`emergency_alert_id = $${i++}`); params.push(alertId); }
    const { rows } = await query(`SELECT * FROM emergency_acknowledgements WHERE ${conditions.join(' AND ')} ORDER BY acknowledged_at DESC`, params);
    return rows.map(mapEmergencyAcknowledgement);
  },
};
