import { query } from '../db/pool.js';

/** @type {any} */
const mapCaseTag = (row) => ({
  id: row.id,
  caseId: row.case_id,
  tag: row.tag,
  color: row.color,
  createdBy: row.created_by,
  createdAt: row.created_at,
});

export const caseTagRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO case_tags (case_id, tag, color, created_by) VALUES ($1, $2, $3, $4) ON CONFLICT (case_id, tag) DO UPDATE SET case_id = EXCLUDED.case_id RETURNING *`,
      [input.caseId, input.tag, input.color ?? '#2563eb', input.createdBy ?? null],
    );
    return mapCaseTag(rows[0]);
  },

  async listByCase(caseId) {
    const { rows } = await query(`SELECT * FROM case_tags WHERE case_id = $1 ORDER BY created_at DESC`, [caseId]);
    return rows.map(mapCaseTag);
  },

  async removeByCaseAndTag(caseId, tag) {
    await query(`DELETE FROM case_tags WHERE case_id = $1 AND tag = $2`, [caseId, tag]);
  },
};
