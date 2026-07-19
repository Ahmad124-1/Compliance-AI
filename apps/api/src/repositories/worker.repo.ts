import { query } from '../db/pool.js';
import { audit } from '../core/audit.js';

const mapWorkerStatusUpdate = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  caseId: row.case_id,
  updateType: row.update_type,
  title: row.title,
  message: row.message,
  isPublic: row.is_public,
  isAnonymous: row.is_anonymous,
  recipientType: row.recipient_type,
  recipientIds: row.recipient_ids,
  channel: row.channel,
  metadata: row.metadata,
  createdAt: row.created_at,
});

const mapWorkerCommunicationTimeline = (row) => ({
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

export const workerRepo = {
  async createStatusUpdate(input) {
    const { rows } = await query(
      `INSERT INTO worker_status_updates (organization_id, case_id, update_type, title, message, is_public, is_anonymous, recipient_type, recipient_ids, channel, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        input.organizationId,
        input.caseId,
        input.updateType,
        input.title,
        input.message,
        input.isPublic ?? false,
        input.isAnonymous ?? true,
        input.recipientType,
        input.recipientIds ?? [],
        input.channel ?? 'in_app',
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    await audit({ action: 'worker.status_update.create', entity: 'worker_status_update', entityId: rows[0].id, organizationId: input.organizationId });
    return mapWorkerStatusUpdate(rows[0]);
  },

  async findStatusUpdateById(id) {
    const { rows } = await query(`SELECT * FROM worker_status_updates WHERE id = $1`, [id]);
    return rows[0] ? mapWorkerStatusUpdate(rows[0]) : null;
  },

  async listByCase(caseId, limit = 50, offset = 0) {
    const { rows } = await query(
      `SELECT * FROM worker_status_updates WHERE case_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [caseId, limit, offset],
    );
    return rows.map(mapWorkerStatusUpdate);
  },

  async listByOrg(orgId, limit = 100, offset = 0) {
    const { rows } = await query(
      `SELECT * FROM worker_status_updates WHERE organization_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [orgId, limit, offset],
    );
    return rows.map(mapWorkerStatusUpdate);
  },

  async createTimelineEntry(input) {
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
    await audit({ action: 'worker.timeline.create', entity: 'worker_communication_timeline', entityId: rows[0].id, organizationId: input.organizationId });
    return mapWorkerCommunicationTimeline(rows[0]);
  },

  async listTimelineByCase(caseId, limit = 100, offset = 0) {
    const { rows } = await query(
      `SELECT * FROM worker_communication_timeline WHERE case_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [caseId, limit, offset],
    );
    return rows.map(mapWorkerCommunicationTimeline);
  },
};
