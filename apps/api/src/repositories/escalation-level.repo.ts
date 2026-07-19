import { query } from '../db/pool.js';

export const mapEscalationLevel = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  name: row.name,
  level: row.level,
  description: row.description,
  roleId: row.role_id,
  notifyRoles: row.notify_roles,
  autoEscalateAfterMinutes: row.auto_escalate_after_minutes,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const escalationLevelRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO escalation_levels (organization_id, name, level, description, role_id, notify_roles, auto_escalate_after_minutes, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        input.organizationId,
        input.name,
        input.level,
        input.description ?? null,
        input.roleId ?? null,
        input.notifyRoles ?? [],
        input.autoEscalateAfterMinutes ?? null,
        input.isActive ?? true,
      ],
    );
    return mapEscalationLevel(rows[0]);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM escalation_levels WHERE id = $1`, [id]);
    return rows[0] ? mapEscalationLevel(rows[0]) : null;
  },

  async listByOrg(orgId) {
    const { rows } = await query(`SELECT * FROM escalation_levels WHERE organization_id = $1 ORDER BY level ASC`, [orgId]);
    return rows.map(mapEscalationLevel);
  },

  async findByOrganization(orgId: string) {
    return this.listByOrg(orgId);
  },

  async update(id, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col, val) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.level !== undefined) set('level', patch.level);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.roleId !== undefined) set('role_id', patch.roleId);
    if (patch.notifyRoles !== undefined) set('notify_roles', patch.notifyRoles);
    if (patch.autoEscalateAfterMinutes !== undefined) set('auto_escalate_after_minutes', patch.autoEscalateAfterMinutes);
    if (patch.isActive !== undefined) set('is_active', patch.isActive);
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE escalation_levels SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapEscalationLevel(rows[0]) : null;
  },

  async delete(id) {
    await query(`DELETE FROM escalation_levels WHERE id = $1`, [id]);
  },

  async findLevelByNumber(orgId, level) {
    const { rows } = await query(`SELECT * FROM escalation_levels WHERE organization_id = $1 AND level = $2`, [orgId, level]);
    return rows[0] ? mapEscalationLevel(rows[0]) : null;
  },
};
