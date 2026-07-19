import { query } from '../db/pool.js';

export const mapSlaDefinition = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  name: row.name,
  description: row.description,
  slaType: row.sla_type,
  priority: row.priority,
  severity: row.severity,
  category: row.category,
  targetDurationMinutes: row.target_duration_minutes,
  isActive: row.is_active,
  isDefault: row.is_default,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const slaDefinitionRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO sla_definitions (organization_id, name, description, sla_type, priority, severity, category, target_duration_minutes, is_active, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        input.organizationId,
        input.name,
        input.description ?? null,
        input.slaType,
        input.priority,
        input.severity ?? null,
        input.category ?? null,
        input.targetDurationMinutes,
        input.isActive ?? true,
        input.isDefault ?? false,
      ],
    );
    return mapSlaDefinition(rows[0]);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM sla_definitions WHERE id = $1`, [id]);
    return rows[0] ? mapSlaDefinition(rows[0]) : null;
  },

  async findByOrganization(orgId, filters: any = {}) {
    const conditions = ['organization_id = $1'];
    const params = [orgId];
    let i = 2;

    if (filters.slaType) { conditions.push(`sla_type = $${i++}`); params.push(filters.slaType); }
    if (filters.priority) { conditions.push(`priority = $${i++}`); params.push(filters.priority); }
    if (filters.isActive !== undefined) { conditions.push(`is_active = $${i++}`); params.push(filters.isActive); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(`SELECT * FROM sla_definitions ${where} ORDER BY created_at DESC`, params);
    return rows.map(mapSlaDefinition);
  },

  async update(id, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col, val) => { sets.push(`${col} = $${i++}`); params.push(val); };

    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.slaType !== undefined) set('sla_type', patch.slaType);
    if (patch.priority !== undefined) set('priority', patch.priority);
    if (patch.severity !== undefined) set('severity', patch.severity);
    if (patch.category !== undefined) set('category', patch.category);
    if (patch.targetDurationMinutes !== undefined) set('target_duration_minutes', patch.targetDurationMinutes);
    if (patch.isActive !== undefined) set('is_active', patch.isActive);
    if (patch.isDefault !== undefined) set('is_default', patch.isDefault);
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE sla_definitions SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapSlaDefinition(rows[0]) : null;
  },

  async delete(id) {
    await query(`DELETE FROM sla_definitions WHERE id = $1`, [id]);
  },

  async findDefaultByType(orgId, slaType) {
    const { rows } = await query(`SELECT * FROM sla_definitions WHERE organization_id = $1 AND sla_type = $2 AND is_default = TRUE LIMIT 1`, [orgId, slaType]);
    return rows[0] ? mapSlaDefinition(rows[0]) : null;
  },
};
