import { query } from '../db/pool.js';

/** @type {any} */
const mapRootCause = (row) => ({
  id: row.id,
  caseId: row.case_id,
  investigationId: row.investigation_id,
  authorId: row.author_id,
  category: row.category,
  description: row.description,
  contributingFactors: row.contributing_factors ?? [],
  verified: row.verified,
  verificationMethod: row.verification_method,
  metadata: row.metadata,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const rootCauseRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO root_causes (case_id, investigation_id, author_id, category, description, contributing_factors, verified, verification_method, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        input.caseId,
        input.investigationId,
        input.authorId,
        input.category,
        input.description,
        input.contributingFactors ?? [],
        input.verified ?? false,
        input.verificationMethod ?? null,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    return mapRootCause(rows[0]);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM root_causes WHERE id = $1`, [id]);
    return rows[0] ? mapRootCause(rows[0]) : null;
  },

  async findByCaseId(caseId) {
    const { rows } = await query(`SELECT * FROM root_causes WHERE case_id = $1 ORDER BY created_at DESC`, [caseId]);
    return rows.map(mapRootCause);
  },

  async findByInvestigationId(investigationId) {
    const { rows } = await query(`SELECT * FROM root_causes WHERE investigation_id = $1 ORDER BY created_at DESC`, [investigationId]);
    return rows.map(mapRootCause);
  },

  async update(id, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col, val) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.category !== undefined) set('category', patch.category);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.contributingFactors !== undefined) set('contributing_factors', patch.contributingFactors);
    if (patch.verified !== undefined) set('verified', patch.verified);
    if (patch.verificationMethod !== undefined) set('verification_method', patch.verificationMethod);
    if (patch.metadata !== undefined) set('metadata', JSON.stringify(patch.metadata));
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE root_causes SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapRootCause(rows[0]) : null;
  },

  async delete(id) {
    await query(`DELETE FROM root_causes WHERE id = $1`, [id]);
  },
};
