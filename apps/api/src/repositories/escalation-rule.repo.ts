import { query } from '../db/pool.js';

/** @type {any} */
const mapEscalationRule = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  name: row.name,
  description: row.description,
  conditionType: row.condition_type,
  conditionValue: row.condition_value,
  escalateToRole: row.escalate_to_role,
  escalateToUserId: row.escalate_to_user_id,
  notificationChannel: row.notification_channel,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/** @type {any} */
const mapEscalationHistory = (row) => ({
  id: row.id,
  caseId: row.case_id,
  ruleId: row.rule_id,
  triggeredBy: row.triggered_by,
  escalatedTo: row.escalated_to,
  previousAssignee: row.previous_assignee,
  reason: row.reason,
  metadata: row.metadata,
  createdAt: row.created_at,
});

export const escalationRuleRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO escalation_rules (organization_id, name, description, condition_type, condition_value, escalate_to_role, escalate_to_user_id, notification_channel, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        input.organizationId,
        input.name,
        input.description ?? null,
        input.conditionType,
        input.conditionValue,
        input.escalateToRole,
        input.escalateToUserId ?? null,
        input.notificationChannel ?? 'email',
        input.isActive ?? true,
      ],
    );
    return mapEscalationRule(rows[0]);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM escalation_rules WHERE id = $1`, [id]);
    return rows[0] ? mapEscalationRule(rows[0]) : null;
  },

  async findByOrganization(orgId) {
    const { rows } = await query(`SELECT * FROM escalation_rules WHERE organization_id = $1 ORDER BY created_at DESC`, [orgId]);
    return rows.map(mapEscalationRule);
  },

  async update(id, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col, val) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.conditionType !== undefined) set('condition_type', patch.conditionType);
    if (patch.conditionValue !== undefined) set('condition_value', patch.conditionValue);
    if (patch.escalateToRole !== undefined) set('escalate_to_role', patch.escalateToRole);
    if (patch.escalateToUserId !== undefined) set('escalate_to_user_id', patch.escalateToUserId);
    if (patch.notificationChannel !== undefined) set('notification_channel', patch.notificationChannel);
    if (patch.isActive !== undefined) set('is_active', patch.isActive);
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE escalation_rules SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapEscalationRule(rows[0]) : null;
  },

  async delete(id) {
    await query(`DELETE FROM escalation_rules WHERE id = $1`, [id]);
  },

  async listActive(orgId) {
    const { rows } = await query(`SELECT * FROM escalation_rules WHERE organization_id = $1 AND is_active = TRUE ORDER BY name`, [orgId]);
    return rows.map(mapEscalationRule);
  },
};

export const escalationHistoryRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO escalation_history (case_id, rule_id, triggered_by, escalated_to, previous_assignee, reason, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        input.caseId,
        input.ruleId ?? null,
        input.triggeredBy ?? null,
        input.escalatedTo ?? null,
        input.previousAssignee ?? null,
        input.reason,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    return mapEscalationHistory(rows[0]);
  },

  async listByCase(caseId) {
    const { rows } = await query(`SELECT * FROM escalation_history WHERE case_id = $1 ORDER BY created_at DESC`, [caseId]);
    return rows.map(mapEscalationHistory);
  },
};
