import { query } from '../db/pool.js';

/** @type {any} */
const mapCaseLink = (row) => ({
  id: row.id,
  caseId: row.case_id,
  relatedCaseId: row.related_case_id,
  linkType: row.link_type,
  createdBy: row.created_by,
  createdAt: row.created_at,
});

export const caseLinkRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO case_links (case_id, related_case_id, link_type, created_by) VALUES ($1, $2, $3, $4) ON CONFLICT (case_id, related_case_id, link_type) DO UPDATE SET case_id = EXCLUDED.case_id RETURNING *`,
      [input.caseId, input.relatedCaseId, input.linkType ?? 'related', input.createdBy ?? null],
    );
    return mapCaseLink(rows[0]);
  },

  async listByCase(caseId) {
    const { rows } = await query(
      `SELECT * FROM case_links WHERE case_id = $1 ORDER BY created_at DESC`,
      [caseId],
    );
    return rows.map(mapCaseLink);
  },

  async remove(id) {
    await query(`DELETE FROM case_links WHERE id = $1`, [id]);
  },
};
