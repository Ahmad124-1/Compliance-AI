import { query } from '../db/pool.js';

export const mapWorkerTimelineEntry = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  caseId: row.case_id,
  actorId: row.actor_id,
  actorType: row.actor_type,
  action: row.action,
  description: row.description,
  metadata: row.metadata,
  isAnonymous: row.is_anonymous,
  createdAt: row.created_at,
});

export const workerCommunicationTimelineRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO worker_communication_timeline (organization_id, case_id, actor_id, actor_type, action, description, metadata, is_anonymous)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        input.organizationId,
        input.caseId,
        input.actorId ?? null,
        input.actorType,
        input.action,
        input.description,
        JSON.stringify(input.metadata ?? {}),
        input.isAnonymous ?? true,
      ],
    );
    return mapWorkerTimelineEntry(rows[0]);
  },

  async findByCase(orgId, caseId) {
    const { rows } = await query(`SELECT * FROM worker_communication_timeline WHERE organization_id = $1 AND case_id = $2 ORDER BY created_at ASC`, [orgId, caseId]);
    return rows.map(mapWorkerTimelineEntry);
  },
};
