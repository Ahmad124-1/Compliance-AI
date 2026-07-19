import { query } from '../db/pool.js';

export const mapNotificationPreference = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  userId: row.user_id,
  channel: row.channel,
  notificationType: row.notification_type,
  enabled: row.enabled,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const notificationPreferenceRepo = {
  async upsert(input) {
    const { rows } = await query(
      `INSERT INTO notification_preferences (organization_id, user_id, channel, notification_type, enabled)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (organization_id, user_id, channel, notification_type)
       DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = now()
       RETURNING *`,
      [input.organizationId, input.userId, input.channel, input.notificationType, input.enabled],
    );
    return mapNotificationPreference(rows[0]);
  },

  async findByUser(orgId, userId) {
    const { rows } = await query(`SELECT * FROM notification_preferences WHERE organization_id = $1 AND user_id = $2`, [orgId, userId]);
    return rows.map(mapNotificationPreference);
  },

  async findByUserAndChannel(orgId, userId, channel, notificationType) {
    const { rows } = await query(
      `SELECT * FROM notification_preferences WHERE organization_id = $1 AND user_id = $2 AND channel = $3 AND notification_type = $4`,
      [orgId, userId, channel, notificationType],
    );
    return rows[0] ? mapNotificationPreference(rows[0]) : null;
  },
};
