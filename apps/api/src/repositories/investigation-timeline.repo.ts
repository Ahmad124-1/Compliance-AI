import { query } from '../db/pool.js';

/** @type {any} */
const mapTimelineEvent = (row) => ({
  id: row.id,
  investigationId: row.investigation_id,
  actorId: row.actor_id,
  action: row.action,
  entityType: row.entity_type,
  entityId: row.entity_id,
  description: row.description,
  metadata: row.metadata,
  createdAt: row.created_at,
});

export const investigationTimelineRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO investigation_timeline (investigation_id, actor_id, action, entity_type, entity_id, description, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        input.investigationId,
        input.actorId ?? null,
        input.action,
        input.entityType ?? null,
        input.entityId ?? null,
        input.description,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    return mapTimelineEvent(rows[0]);
  },

  async listByInvestigation(investigationId, limit = 100, offset = 0) {
    const { rows } = await query(
      `SELECT * FROM investigation_timeline WHERE investigation_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [investigationId, limit, offset],
    );
    return rows.map(mapTimelineEvent);
  },

  async listByActor(actorId) {
    const { rows } = await query(
      `SELECT * FROM investigation_timeline WHERE actor_id = $1 ORDER BY created_at DESC`,
      [actorId],
    );
    return rows.map(mapTimelineEvent);
  },
};
