import { query } from '../db/pool.js';

export const mapAnalyticsCommDailySummary = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  summaryDate: row.summary_date,
  channel: row.channel,
  notificationsSent: row.notifications_sent,
  notificationsDelivered: row.notifications_delivered,
  notificationsRead: row.notifications_read,
  notificationsFailed: row.notifications_failed,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const analyticsCommunicationDailySummaryRepo = {
  async upsert(input) {
    const { rows } = await query(
      `INSERT INTO analytics_communication_daily_summaries (organization_id, summary_date, channel, notifications_sent, notifications_delivered, notifications_read, notifications_failed)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (organization_id, channel, summary_date)
       DO UPDATE SET notifications_sent = EXCLUDED.notifications_sent, notifications_delivered = EXCLUDED.notifications_delivered, notifications_read = EXCLUDED.notifications_read, notifications_failed = EXCLUDED.notifications_failed, updated_at = now()
       RETURNING *`,
      [input.organizationId, input.summaryDate, input.channel, input.notificationsSent ?? 0, input.notificationsDelivered ?? 0, input.notificationsRead ?? 0, input.notificationsFailed ?? 0],
    );
    return mapAnalyticsCommDailySummary(rows[0]);
  },

  async findByDateRange(orgId, dateFrom, dateTo) {
    const { rows } = await query(
      `SELECT * FROM analytics_communication_daily_summaries WHERE organization_id = $1 AND summary_date >= $2 AND summary_date <= $3 ORDER BY summary_date ASC`,
      [orgId, dateFrom, dateTo],
    );
    return rows.map(mapAnalyticsCommDailySummary);
  },
};
