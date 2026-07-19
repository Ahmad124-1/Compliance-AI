import { query } from '../db/pool.js';

/** @type {any} */
const mapCaseActivity = (row) => ({
  id: row.id,
  caseId: row.case_id,
  actorId: row.actor_id,
  activityType: row.activity_type,
  description: row.description,
  metadata: row.metadata,
  createdAt: row.created_at,
});

export const caseActivityRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO case_activities (case_id, actor_id, activity_type, description, metadata)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [input.caseId, input.actorId ?? null, input.activityType, input.description, JSON.stringify(input.metadata ?? {})],
    );
    return mapCaseActivity(rows[0]);
  },

  async listByCase(caseId, limit = 50, offset = 0) {
    const { rows } = await query(
      `SELECT * FROM case_activities WHERE case_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [caseId, limit, offset],
    );
    return rows.map(mapCaseActivity);
  },
};
