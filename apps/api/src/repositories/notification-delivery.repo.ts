import { query } from '../db/pool.js';

export const mapNotificationDelivery = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  notificationId: row.notification_id,
  channel: row.channel,
  status: row.status,
  attempts: row.attempts,
  lastError: row.last_error,
  scheduledAt: row.scheduled_at,
  sentAt: row.sent_at,
  deliveredAt: row.delivered_at,
  readAt: row.read_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const notificationDeliveryRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO notification_deliveries (organization_id, notification_id, channel, status, scheduled_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [input.organizationId, input.notificationId, input.channel, input.status ?? 'pending', input.scheduledAt ?? new Date()],
    );
    return mapNotificationDelivery(rows[0]);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM notification_deliveries WHERE id = $1`, [id]);
    return rows[0] ? mapNotificationDelivery(rows[0]) : null;
  },

  async listByNotification(notificationId) {
    const { rows } = await query(`SELECT * FROM notification_deliveries WHERE notification_id = $1 ORDER BY created_at DESC`, [notificationId]);
    return rows.map(mapNotificationDelivery);
  },

  async updateStatus(id, status, error?) {
    const sets = [`status = $1`];
    const params = [status];
    let i = 2;
    if (status === 'sent') sets.push(`sent_at = $${i++}`);
    if (status === 'delivered') sets.push(`delivered_at = $${i++}`);
    if (error) { sets.push(`last_error = $${i++}`); params.push(error); }
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE notification_deliveries SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapNotificationDelivery(rows[0]) : null;
  },

  async incrementAttempt(id) {
    const { rows } = await query(`UPDATE notification_deliveries SET attempts = attempts + 1, updated_at = now() WHERE id = $1 RETURNING *`, [id]);
    return rows[0] ? mapNotificationDelivery(rows[0]) : null;
  },

  async listFailed(orgId, limit = 50) {
    const { rows } = await query(
      `SELECT * FROM notification_deliveries WHERE organization_id = $1 AND status = 'failed' AND attempts < 3 ORDER BY created_at ASC LIMIT $2`,
      [orgId, limit],
    );
    return rows.map(mapNotificationDelivery);
  },

  async listPending(limit = 50) {
    const { rows } = await query(
      `SELECT * FROM notification_deliveries WHERE status IN ('pending', 'queued') ORDER BY scheduled_at ASC LIMIT $1`,
      [limit],
    );
    return rows.map(mapNotificationDelivery);
  },
};
