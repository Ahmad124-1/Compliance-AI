import { query } from '../db/pool.js';

/** @type {any} */
const mapCaseLabel = (row) => ({
  id: row.id,
  caseId: row.case_id,
  label: row.label,
  category: row.category,
  isSystem: row.is_system,
  createdBy: row.created_by,
  createdAt: row.created_at,
});

export const caseLabelRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO case_labels (case_id, label, category, is_system, created_by) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (case_id, label) DO UPDATE SET case_id = EXCLUDED.case_id RETURNING *`,
      [input.caseId, input.label, input.category ?? null, input.isSystem ?? false, input.createdBy ?? null],
    );
    return mapCaseLabel(rows[0]);
  },

  async listByCase(caseId) {
    const { rows } = await query(`SELECT * FROM case_labels WHERE case_id = $1 ORDER BY created_at DESC`, [caseId]);
    return rows.map(mapCaseLabel);
  },

  async removeByCaseAndLabel(caseId, label) {
    await query(`DELETE FROM case_labels WHERE case_id = $1 AND label = $2`, [caseId, label]);
  },
};
