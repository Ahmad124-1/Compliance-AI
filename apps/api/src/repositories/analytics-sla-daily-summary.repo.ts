import { query } from '../db/pool.js';

export const mapAnalyticsSlaDailySummary = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  summaryDate: row.summary_date,
  slaType: row.sla_type,
  totalInstances: row.total_instances,
  metCount: row.met_count,
  breachedCount: row.breached_count,
  pausedCount: row.paused_count,
  avgTimeToBreachMinutes: row.avg_time_to_breach_minutes,
  complianceRate: row.compliance_rate,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const analyticsSlaDailySummaryRepo = {
  async upsert(input) {
    const { rows } = await query(
      `INSERT INTO analytics_sla_daily_summaries (organization_id, summary_date, sla_type, total_instances, met_count, breached_count, paused_count, avg_time_to_breach_minutes, compliance_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (organization_id, sla_type, summary_date)
       DO UPDATE SET total_instances = EXCLUDED.total_instances, met_count = EXCLUDED.met_count, breached_count = EXCLUDED.breached_count, paused_count = EXCLUDED.paused_count, avg_time_to_breach_minutes = EXCLUDED.avg_time_to_breach_minutes, compliance_rate = EXCLUDED.compliance_rate, updated_at = now()
       RETURNING *`,
      [
        input.organizationId,
        input.summaryDate,
        input.slaType,
        input.totalInstances ?? 0,
        input.metCount ?? 0,
        input.breachedCount ?? 0,
        input.pausedCount ?? 0,
        input.avgTimeToBreachMinutes ?? null,
        input.complianceRate ?? null,
      ],
    );
    return mapAnalyticsSlaDailySummary(rows[0]);
  },

  async findByDateRange(orgId, dateFrom, dateTo) {
    const { rows } = await query(
      `SELECT * FROM analytics_sla_daily_summaries WHERE organization_id = $1 AND summary_date >= $2 AND summary_date <= $3 ORDER BY summary_date ASC`,
      [orgId, dateFrom, dateTo],
    );
    return rows.map(mapAnalyticsSlaDailySummary);
  },
};
