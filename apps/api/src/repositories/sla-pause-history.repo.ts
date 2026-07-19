import { query } from '../db/pool.js';

export const mapSlaPauseHistory = (row) => ({
  id: row.id,
  slaInstanceId: row.sla_instance_id,
  reason: row.reason,
  pausedAt: row.paused_at,
  resumedAt: row.resumed_at,
  createdAt: row.created_at,
});

export const slaPauseHistoryRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO sla_pause_history (sla_instance_id, reason) VALUES ($1, $2) RETURNING *`,
      [input.slaInstanceId, input.reason],
    );
    return mapSlaPauseHistory(rows[0]);
  },

  async listByInstance(slaInstanceId) {
    const { rows } = await query(`SELECT * FROM sla_pause_history WHERE sla_instance_id = $1 ORDER BY created_at DESC`, [slaInstanceId]);
    return rows.map(mapSlaPauseHistory);
  },

  async resumeLatest(slaInstanceId) {
    const { rows } = await query(
      `UPDATE sla_pause_history SET resumed_at = now() WHERE sla_instance_id = $1 AND resumed_at IS NULL ORDER BY created_at DESC LIMIT 1 RETURNING *`,
      [slaInstanceId],
    );
    return rows[0] ? mapSlaPauseHistory(rows[0]) : null;
  },
};
