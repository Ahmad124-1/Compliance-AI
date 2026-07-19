import { query } from '../db/pool.js';

export const mapNotification = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  userId: row.user_id,
  type: row.type,
  channel: row.channel,
  title: row.title,
  body: row.body,
  data: row.data,
  readAt: row.read_at,
  archivedAt: row.archived_at,
  deletedAt: row.deleted_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapNotificationPreference = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  userId: row.user_id,
  channel: row.channel,
  notificationType: row.notification_type,
  enabled: row.enabled,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapNotificationDelivery = (row) => ({
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

export const notificationRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO notifications (organization_id, user_id, type, channel, title, body, data)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        input.organizationId,
        input.userId,
        input.type ?? 'system',
        input.channel ?? 'in_app',
        input.title,
        input.body,
        JSON.stringify(input.data ?? {}),
      ],
    );
    return mapNotification(rows[0]);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM notifications WHERE id = $1 AND deleted_at IS NULL`, [id]);
    return rows[0] ? mapNotification(rows[0]) : null;
  },

  async findByUser(userId, limit = 50, offset = 0) {
    const { rows } = await query(
      `SELECT * FROM notifications WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    return rows.map(mapNotification);
  },

  async listByOrganization(orgId, filters: any = {}) {
    const conditions = ['n.organization_id = $1'];
    const params = [orgId];
    let i = 2;

    if (filters.userId) { conditions.push(`n.user_id = $${i++}`); params.push(filters.userId); }
    if (filters.type) { conditions.push(`n.type = $${i++}`); params.push(filters.type); }
    if (filters.channel) { conditions.push(`n.channel = $${i++}`); params.push(filters.channel); }
    if (filters.isRead !== undefined) {
      if (filters.isRead) { conditions.push(`n.read_at IS NOT NULL`); }
      else { conditions.push(`n.read_at IS NULL`); }
    }
    if (filters.isArchived !== undefined) {
      if (filters.isArchived) { conditions.push(`n.archived_at IS NOT NULL`); }
      else { conditions.push(`n.archived_at IS NULL`); }
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const countSql = `SELECT COUNT(*) FROM notifications n ${where}`;
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const limit = filters.limit ?? 25;
    const offset = filters.offset ?? 0;
    const dataSql = `SELECT * FROM notifications n ${where} ORDER BY n.created_at DESC LIMIT $${i} OFFSET $${i + 1}`;
    const dataParams = [...params, limit, offset];
    const { rows } = await query(dataSql, dataParams);

    return { notifications: rows.map(mapNotification), total };
  },

  async markAsRead(id, _userId?: string) {
    const { rows } = await query(`UPDATE notifications SET read_at = now(), updated_at = now() WHERE id = $1 RETURNING *`, [id]);
    return rows[0] ? mapNotification(rows[0]) : null;
  },

  async archive(id, _userId?: string) {
    const { rows } = await query(`UPDATE notifications SET archived_at = now(), updated_at = now() WHERE id = $1 RETURNING *`, [id]);
    return rows[0] ? mapNotification(rows[0]) : null;
  },

  async softDelete(id, _userId?: string) {
    await query(`UPDATE notifications SET deleted_at = now(), updated_at = now() WHERE id = $1`, [id]);
  },

  async findByOrganization(orgId: string, filters: any = {}) {
    return this.listByOrganization(orgId, filters);
  },

  async getUnreadCount(orgId: string, userId: string) {
    const { rows } = await query(
      `SELECT COUNT(*) FROM notifications WHERE organization_id = $1 AND user_id = $2 AND read_at IS NULL AND deleted_at IS NULL`,
      [orgId, userId],
    );
    return parseInt(rows[0].count, 10);
  },

  async bulkMarkAsRead(orgId: string, userId: string, ids: string[]) {
    if (!ids.length) return;
    const placeholders = ids.map((_, idx) => `$${idx + 3}`).join(', ');
    await query(
      `UPDATE notifications SET read_at = now(), updated_at = now() WHERE organization_id = $1 AND user_id = $2 AND id IN (${placeholders})`,
      [orgId, userId, ...ids],
    );
  },

  async createPreference(input) {
    const { rows } = await query(
      `INSERT INTO notification_preferences (organization_id, user_id, channel, notification_type, enabled)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [input.organizationId, input.userId, input.channel, input.notificationType, input.enabled ?? true],
    );
    return mapNotificationPreference(rows[0]);
  },

  async findPreferences(orgId, userId) {
    const { rows } = await query(
      `SELECT * FROM notification_preferences WHERE organization_id = $1 AND user_id = $2 ORDER BY channel, notification_type`,
      [orgId, userId],
    );
    return rows.map(mapNotificationPreference);
  },

  async upsertPreference(input) {
    const { rows } = await query(
      `INSERT INTO notification_preferences (organization_id, user_id, channel, notification_type, enabled)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (organization_id, user_id, channel, notification_type)
       DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = now()
       RETURNING *`,
      [input.organizationId, input.userId, input.channel, input.notificationType, input.enabled ?? true],
    );
    return mapNotificationPreference(rows[0]);
  },

  async listPreferences(orgId, userId) {
    const { rows } = await query(
      `SELECT * FROM notification_preferences WHERE organization_id = $1 AND user_id = $2`,
      [orgId, userId],
    );
    return rows.map(mapNotificationPreference);
  },

  async createDelivery(input) {
    const { rows } = await query(
      `INSERT INTO notification_deliveries (organization_id, notification_id, channel, status, scheduled_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [input.organizationId, input.notificationId, input.channel, input.status ?? 'pending', input.scheduledAt ?? new Date()],
    );
    return mapNotificationDelivery(rows[0]);
  },

  async findDeliveryById(id) {
    const { rows } = await query(`SELECT * FROM notification_deliveries WHERE id = $1`, [id]);
    return rows[0] ? mapNotificationDelivery(rows[0]) : null;
  },

  async updateDelivery(id, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col, val) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.attempts !== undefined) set('attempts', patch.attempts);
    if (patch.lastError !== undefined) set('last_error', patch.lastError);
    if (patch.sentAt !== undefined) set('sent_at', patch.sentAt);
    if (patch.deliveredAt !== undefined) set('delivered_at', patch.deliveredAt);
    if (patch.readAt !== undefined) set('read_at', patch.readAt);
    if (!sets.length) return this.findDeliveryById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE notification_deliveries SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapNotificationDelivery(rows[0]) : null;
  },

  async listDeliveriesByNotification(notificationId) {
    const { rows } = await query(`SELECT * FROM notification_deliveries WHERE notification_id = $1 ORDER BY created_at DESC`, [notificationId]);
    return rows.map(mapNotificationDelivery);
  },
};
