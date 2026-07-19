import { query } from '../db/pool.js';

/** @type {any} */
const mapResolution = (row) => ({
  id: row.id,
  caseId: row.case_id,
  investigationId: row.investigation_id,
  authorId: row.author_id,
  type: row.type,
  description: row.description,
  actionsTaken: row.actions_taken,
  preventiveMeasures: row.preventive_measures,
  estimatedCost: row.estimated_cost,
  actualCost: row.actual_cost,
  implementedAt: row.implemented_at,
  verifiedAt: row.verified_at,
  verifiedBy: row.verified_by,
  isFinal: row.is_final,
  metadata: row.metadata,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const resolutionRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO resolutions (case_id, investigation_id, author_id, type, description, actions_taken, preventive_measures, estimated_cost, actual_cost, implemented_at, verified_at, verified_by, is_final, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        input.caseId,
        input.investigationId,
        input.authorId,
        input.type,
        input.description,
        input.actionsTaken,
        input.preventiveMeasures ?? null,
        input.estimatedCost ?? null,
        input.actualCost ?? null,
        input.implementedAt ?? null,
        input.verifiedAt ?? null,
        input.verifiedBy ?? null,
        input.isFinal ?? false,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    return mapResolution(rows[0]);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM resolutions WHERE id = $1`, [id]);
    return rows[0] ? mapResolution(rows[0]) : null;
  },

  async findByCaseId(caseId) {
    const { rows } = await query(`SELECT * FROM resolutions WHERE case_id = $1 ORDER BY created_at DESC`, [caseId]);
    return rows.map(mapResolution);
  },

  async findByInvestigationId(investigationId) {
    const { rows } = await query(`SELECT * FROM resolutions WHERE investigation_id = $1 ORDER BY created_at DESC`, [investigationId]);
    return rows.map(mapResolution);
  },

  async update(id, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col, val) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.type !== undefined) set('type', patch.type);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.actionsTaken !== undefined) set('actions_taken', patch.actionsTaken);
    if (patch.preventiveMeasures !== undefined) set('preventive_measures', patch.preventiveMeasures);
    if (patch.estimatedCost !== undefined) set('estimated_cost', patch.estimatedCost);
    if (patch.actualCost !== undefined) set('actual_cost', patch.actualCost);
    if (patch.implementedAt !== undefined) set('implemented_at', patch.implementedAt);
    if (patch.verifiedAt !== undefined) set('verified_at', patch.verifiedAt);
    if (patch.verifiedBy !== undefined) set('verified_by', patch.verifiedBy);
    if (patch.isFinal !== undefined) set('is_final', patch.isFinal);
    if (patch.metadata !== undefined) set('metadata', JSON.stringify(patch.metadata));
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE resolutions SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapResolution(rows[0]) : null;
  },

  async delete(id) {
    await query(`DELETE FROM resolutions WHERE id = $1`, [id]);
  },
};
