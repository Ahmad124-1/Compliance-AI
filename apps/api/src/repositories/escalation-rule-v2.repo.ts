import { query } from '../db/pool.js';

export const mapEscalationRuleV2 = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  name: row.name,
  description: row.description,
  conditionType: row.condition_type,
  conditionValue: row.condition_value,
  conditionOperator: row.condition_operator,
  escalateToLevelId: row.escalate_to_level_id,
  escalateToRoleId: row.escalate_to_role_id,
  escalateToUserId: row.escalate_to_user_id,
  notificationChannels: row.notification_channels,
  autoEscalate: row.auto_escalate,
  autoEscalateAfterMinutes: row.auto_escalate_after_minutes,
  requireApproval: row.require_approval,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const escalationRuleV2Repo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO escalation_rules_v2 (organization_id, name, description, condition_type, condition_value, condition_operator, escalate_to_level_id, escalate_to_role_id, escalate_to_user_id, notification_channels, auto_escalate, auto_escalate_after_minutes, require_approval, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        input.organizationId,
        input.name,
        input.description ?? null,
        input.conditionType,
        input.conditionValue,
        input.conditionOperator ?? 'equals',
        input.escalateToLevelId ?? null,
        input.escalateToRoleId ?? null,
        input.escalateToUserId ?? null,
        input.notificationChannels ?? ['in_app', 'email'],
        input.autoEscalate ?? false,
        input.autoEscalateAfterMinutes ?? null,
        input.requireApproval ?? false,
        input.isActive ?? true,
      ],
    );
    return mapEscalationRuleV2(rows[0]);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM escalation_rules_v2 WHERE id = $1`, [id]);
    return rows[0] ? mapEscalationRuleV2(rows[0]) : null;
  },

  async listByOrg(orgId) {
    const { rows } = await query(`SELECT * FROM escalation_rules_v2 WHERE organization_id = $1 ORDER BY created_at DESC`, [orgId]);
    return rows.map(mapEscalationRuleV2);
  },

  async findByOrganization(orgId: string) {
    return this.listByOrg(orgId);
  },

  async listActive(orgId) {
    const { rows } = await query(`SELECT * FROM escalation_rules_v2 WHERE organization_id = $1 AND is_active = TRUE ORDER BY name`, [orgId]);
    return rows.map(mapEscalationRuleV2);
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
    if (patch.conditionOperator !== undefined) set('condition_operator', patch.conditionOperator);
    if (patch.escalateToLevelId !== undefined) set('escalate_to_level_id', patch.escalateToLevelId);
    if (patch.escalateToRoleId !== undefined) set('escalate_to_role_id', patch.escalateToRoleId);
    if (patch.escalateToUserId !== undefined) set('escalate_to_user_id', patch.escalateToUserId);
    if (patch.notificationChannels !== undefined) set('notification_channels', patch.notificationChannels);
    if (patch.autoEscalate !== undefined) set('auto_escalate', patch.autoEscalate);
    if (patch.autoEscalateAfterMinutes !== undefined) set('auto_escalate_after_minutes', patch.autoEscalateAfterMinutes);
    if (patch.requireApproval !== undefined) set('require_approval', patch.requireApproval);
    if (patch.isActive !== undefined) set('is_active', patch.isActive);
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE escalation_rules_v2 SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapEscalationRuleV2(rows[0]) : null;
  },

  async delete(id) {
    await query(`DELETE FROM escalation_rules_v2 WHERE id = $1`, [id]);
  },
};
