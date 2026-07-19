import { query } from '../db/pool.js';

/** @type {any} */
const mapFinding = (row) => ({
  id: row.id,
  caseId: row.case_id,
  investigationId: row.investigation_id,
  authorId: row.author_id,
  title: row.title,
  description: row.description,
  severity: row.severity,
  confidence: row.confidence,
  evidenceIds: row.evidence_ids ?? [],
  isFinal: row.is_final,
  metadata: row.metadata,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const findingRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO findings (case_id, investigation_id, author_id, title, description, severity, confidence, evidence_ids, is_final, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        input.caseId,
        input.investigationId,
        input.authorId,
        input.title,
        input.description,
        input.severity ?? 'medium',
        input.confidence ?? 'medium',
        input.evidenceIds ?? [],
        input.isFinal ?? false,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    return mapFinding(rows[0]);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM findings WHERE id = $1`, [id]);
    return rows[0] ? mapFinding(rows[0]) : null;
  },

  async findByCaseId(caseId) {
    const { rows } = await query(`SELECT * FROM findings WHERE case_id = $1 ORDER BY created_at DESC`, [caseId]);
    return rows.map(mapFinding);
  },

  async findByInvestigationId(investigationId) {
    const { rows } = await query(`SELECT * FROM findings WHERE investigation_id = $1 ORDER BY created_at DESC`, [investigationId]);
    return rows.map(mapFinding);
  },

  async update(id, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col, val) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.title !== undefined) set('title', patch.title);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.severity !== undefined) set('severity', patch.severity);
    if (patch.confidence !== undefined) set('confidence', patch.confidence);
    if (patch.evidenceIds !== undefined) set('evidence_ids', patch.evidenceIds);
    if (patch.isFinal !== undefined) set('is_final', patch.isFinal);
    if (patch.metadata !== undefined) set('metadata', JSON.stringify(patch.metadata));
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE findings SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapFinding(rows[0]) : null;
  },

  async delete(id) {
    await query(`DELETE FROM findings WHERE id = $1`, [id]);
  },
};
