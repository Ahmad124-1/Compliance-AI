import { query } from '../db/pool.js';

export const mapWorkerStatusUpdate = (row) => ({
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

export const workerStatusUpdateRepo = {
  async create(input) {
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
    return mapWorkerStatusUpdate(rows[0]);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM worker_status_updates WHERE id = $1`, [id]);
    return rows[0] ? mapWorkerStatusUpdate(rows[0]) : null;
  },

  async findByCase(orgId, caseId) {
    const { rows } = await query(`SELECT * FROM worker_status_updates WHERE organization_id = $1 AND case_id = $2 ORDER BY created_at DESC`, [orgId, caseId]);
    return rows.map(mapWorkerStatusUpdate);
  },

  async listByOrganization(orgId, filters: any = {}) {
    const conditions = ['organization_id = $1'];
    const params = [orgId];
    let i = 2;

    if (filters.caseId) { conditions.push(`case_id = $${i++}`); params.push(filters.caseId); }
    if (filters.updateType) { conditions.push(`update_type = $${i++}`); params.push(filters.updateType); }
    if (filters.isPublic !== undefined) { conditions.push(`is_public = $${i++}`); params.push(filters.isPublic); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(`SELECT * FROM worker_status_updates ${where} ORDER BY created_at DESC`, params);
    return rows.map(mapWorkerStatusUpdate);
  },
};
