import { query } from '../db/pool.js';

/** @type {any} */
export const mapEscalationHistory = (row) => ({
  id: row.id,
  caseId: row.case_id,
  ruleId: row.rule_id,
  triggeredBy: row.triggered_by,
  escalatedTo: row.escalated_to,
  previousAssignee: row.previous_assignee,
  reason: row.reason,
  metadata: row.metadata,
  createdAt: row.created_at,
});

export const escalationHistoryRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO escalation_history (case_id, rule_id, triggered_by, escalated_to, previous_assignee, reason, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        input.caseId,
        input.ruleId ?? null,
        input.triggeredBy ?? null,
        input.escalatedTo ?? null,
        input.previousAssignee ?? null,
        input.reason,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    return mapEscalationHistory(rows[0]);
  },

  async listByCase(caseId) {
    const { rows } = await query(`SELECT * FROM escalation_history WHERE case_id = $1 ORDER BY created_at DESC`, [caseId]);
    return rows.map(mapEscalationHistory);
  },
};
