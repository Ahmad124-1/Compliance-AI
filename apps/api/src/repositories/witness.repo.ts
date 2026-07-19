import { query } from '../db/pool.js';

/** @type {any} */
const mapWitness = (row) => ({
  id: row.id,
  caseId: row.case_id,
  fullName: row.full_name,
  email: row.email,
  phone: row.phone,
  role: row.role,
  statement: row.statement,
  isAnonymous: row.is_anonymous,
  protectionLevel: row.protection_level,
  metadata: row.metadata,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const witnessRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO witnesses (case_id, full_name, email, phone, role, statement, is_anonymous, protection_level, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        input.caseId,
        input.fullName,
        input.email ?? null,
        input.phone ?? null,
        input.role ?? null,
        input.statement ?? null,
        input.isAnonymous ?? false,
        input.protectionLevel ?? 'standard',
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    return mapWitness(rows[0]);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM witnesses WHERE id = $1`, [id]);
    return rows[0] ? mapWitness(rows[0]) : null;
  },

  async findByCaseId(caseId) {
    const { rows } = await query(`SELECT * FROM witnesses WHERE case_id = $1 ORDER BY created_at DESC`, [caseId]);
    return rows.map(mapWitness);
  },

  async update(id, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col, val) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.fullName !== undefined) set('full_name', patch.fullName);
    if (patch.email !== undefined) set('email', patch.email);
    if (patch.phone !== undefined) set('phone', patch.phone);
    if (patch.role !== undefined) set('role', patch.role);
    if (patch.statement !== undefined) set('statement', patch.statement);
    if (patch.isAnonymous !== undefined) set('is_anonymous', patch.isAnonymous);
    if (patch.protectionLevel !== undefined) set('protection_level', patch.protectionLevel);
    if (patch.metadata !== undefined) set('metadata', JSON.stringify(patch.metadata));
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE witnesses SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapWitness(rows[0]) : null;
  },

  async delete(id) {
    await query(`DELETE FROM witnesses WHERE id = $1`, [id]);
  },
};
