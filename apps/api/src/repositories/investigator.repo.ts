import { query } from '../db/pool.js';

/** @type {any} */
const mapInvestigator = (row) => ({
  id: row.id,
  userId: row.user_id,
  organizationId: row.organization_id,
  badgeNumber: row.badge_number,
  specialization: row.specialization,
  clearanceLevel: row.clearance_level,
  activeCases: row.active_cases,
  completedCases: row.completed_cases,
  isAvailable: row.is_available,
  metadata: row.metadata,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const investigatorRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO investigators (user_id, organization_id, badge_number, specialization, clearance_level, metadata)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        input.userId,
        input.organizationId,
        input.badgeNumber ?? null,
        input.specialization ?? null,
        input.clearanceLevel ?? 'standard',
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    return mapInvestigator(rows[0]);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM investigators WHERE id = $1`, [id]);
    return rows[0] ? mapInvestigator(rows[0]) : null;
  },

  async findByUserId(userId) {
    const { rows } = await query(`SELECT * FROM investigators WHERE user_id = $1`, [userId]);
    return rows[0] ? mapInvestigator(rows[0]) : null;
  },

  async findByOrganization(orgId) {
    const { rows } = await query(`SELECT * FROM investigators WHERE organization_id = $1`, [orgId]);
    return rows.map(mapInvestigator);
  },

  async listByOrganization(orgId, filters: any = {}) {
    const conditions = ['organization_id = $1'];
    const params = [orgId];
    let i = 2;
    if (filters.isAvailable !== undefined) { conditions.push(`is_available = $${i++}`); params.push(filters.isAvailable); }
    if (filters.specialization) { conditions.push(`specialization = $${i++}`); params.push(filters.specialization); }
    const where = `WHERE ${conditions.join(' AND ')}`;
    const { rows } = await query(`SELECT * FROM investigators ${where} ORDER BY created_at DESC`, params);
    return rows.map(mapInvestigator);
  },

  async update(id, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col, val) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.badgeNumber !== undefined) set('badge_number', patch.badgeNumber);
    if (patch.specialization !== undefined) set('specialization', patch.specialization);
    if (patch.clearanceLevel !== undefined) set('clearance_level', patch.clearanceLevel);
    if (patch.isAvailable !== undefined) set('is_available', patch.isAvailable);
    if (patch.metadata !== undefined) set('metadata', JSON.stringify(patch.metadata));
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE investigators SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapInvestigator(rows[0]) : null;
  },

  async updateWorkload(id, activeCasesDelta, completedCasesDelta) {
    await query(
      `UPDATE investigators SET active_cases = active_cases + $1, completed_cases = completed_cases + $2, updated_at = now() WHERE id = $3`,
      [activeCasesDelta, completedCasesDelta, id],
    );
  },

  async getWorkload(id) {
    const { rows } = await query(
      `SELECT active_cases, completed_cases FROM investigators WHERE id = $1`,
      [id],
    );
    return rows[0] ? { activeCases: rows[0].active_cases, completedCases: rows[0].completed_cases } : null;
  },
};
