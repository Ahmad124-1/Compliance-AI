import { query } from '../db/pool.js';

/** @type {any} */
const mapCaseStatusHistory = (row) => ({
  id: row.id,
  caseId: row.case_id,
  changedBy: row.changed_by,
  oldStatus: row.old_status,
  newStatus: row.new_status,
  reason: row.reason,
  metadata: row.metadata,
  createdAt: row.created_at,
});

export const caseStatusHistoryRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO case_status_history (case_id, changed_by, old_status, new_status, reason, metadata)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [input.caseId, input.changedBy ?? null, input.oldStatus ?? null, input.newStatus, input.reason ?? null, JSON.stringify(input.metadata ?? {})],
    );
    return mapCaseStatusHistory(rows[0]);
  },

  async listByCase(caseId) {
    const { rows } = await query(`SELECT * FROM case_status_history WHERE case_id = $1 ORDER BY created_at DESC`, [caseId]);
    return rows.map(mapCaseStatusHistory);
  },
};
