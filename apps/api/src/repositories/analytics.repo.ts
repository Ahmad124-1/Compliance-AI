import { query } from '../db/pool.js';

const mapAnalyticsCaseDailySummary = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  siteId: row.site_id,
  departmentId: row.department_id,
  summaryDate: row.summary_date,
  totalCases: row.total_cases,
  newCases: row.new_cases,
  closedCases: row.closed_cases,
  openCases: row.open_cases,
  escalatedCases: row.escalated_cases,
  avgResponseTimeMinutes: row.avg_response_time_minutes,
  avgResolutionTimeMinutes: row.avg_resolution_time_minutes,
  avgSlaComplianceRate: row.avg_sla_compliance_rate,
  byStatus: row.by_status,
  byPriority: row.by_priority,
  byCategory: row.by_category,
  bySource: row.by_source,
  byCountry: row.by_country,
  anonymousCases: row.anonymous_cases,
  namedCases: row.named_cases,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapAnalyticsCommunicationDailySummary = (row) => ({
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

const mapAnalyticsSlaDailySummary = (row) => ({
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

export const analyticsRepo = {
  async upsertCaseDailySummary(input) {
    const { rows } = await query(
      `INSERT INTO analytics_case_daily_summaries (organization_id, site_id, department_id, summary_date, total_cases, new_cases, closed_cases, open_cases, escalated_cases, avg_response_time_minutes, avg_resolution_time_minutes, avg_sla_compliance_rate, by_status, by_priority, by_category, by_source, by_country, anonymous_cases, named_cases)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       ON CONFLICT (organization_id, site_id, department_id, summary_date)
       DO UPDATE SET total_cases = EXCLUDED.total_cases, new_cases = EXCLUDED.new_cases, closed_cases = EXCLUDED.closed_cases, open_cases = EXCLUDED.open_cases, escalated_cases = EXCLUDED.escalated_cases, avg_response_time_minutes = EXCLUDED.avg_response_time_minutes, avg_resolution_time_minutes = EXCLUDED.avg_resolution_time_minutes, avg_sla_compliance_rate = EXCLUDED.avg_sla_compliance_rate, by_status = EXCLUDED.by_status, by_priority = EXCLUDED.by_priority, by_category = EXCLUDED.by_category, by_source = EXCLUDED.by_source, by_country = EXCLUDED.by_country, anonymous_cases = EXCLUDED.anonymous_cases, named_cases = EXCLUDED.named_cases, updated_at = now()
       RETURNING *`,
      [
        input.organizationId,
        input.siteId ?? null,
        input.departmentId ?? null,
        input.summaryDate,
        input.totalCases ?? 0,
        input.newCases ?? 0,
        input.closedCases ?? 0,
        input.openCases ?? 0,
        input.escalatedCases ?? 0,
        input.avgResponseTimeMinutes ?? null,
        input.avgResolutionTimeMinutes ?? null,
        input.avgSlaComplianceRate ?? null,
        JSON.stringify(input.byStatus ?? {}),
        JSON.stringify(input.byPriority ?? {}),
        JSON.stringify(input.byCategory ?? {}),
        JSON.stringify(input.bySource ?? {}),
        JSON.stringify(input.byCountry ?? {}),
        input.anonymousCases ?? 0,
        input.namedCases ?? 0,
      ],
    );
    return mapAnalyticsCaseDailySummary(rows[0]);
  },

  async getCaseDailySummary(orgId, siteId, departmentId, summaryDate) {
    const { rows } = await query(
      `SELECT * FROM analytics_case_daily_summaries WHERE organization_id = $1 AND site_id = $2 AND department_id = $3 AND summary_date = $4`,
      [orgId, siteId ?? null, departmentId ?? null, summaryDate],
    );
    return rows[0] ? mapAnalyticsCaseDailySummary(rows[0]) : null;
  },

  async listCaseDailySummaries(orgId, fromDate, toDate) {
    const { rows } = await query(
      `SELECT * FROM analytics_case_daily_summaries WHERE organization_id = $1 AND summary_date >= $2 AND summary_date <= $3 ORDER BY summary_date DESC`,
      [orgId, fromDate, toDate],
    );
    return rows.map(mapAnalyticsCaseDailySummary);
  },

  async upsertCommunicationDailySummary(input) {
    const { rows } = await query(
      `INSERT INTO analytics_communication_daily_summaries (organization_id, summary_date, channel, notifications_sent, notifications_delivered, notifications_read, notifications_failed)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (organization_id, channel, summary_date)
       DO UPDATE SET notifications_sent = EXCLUDED.notifications_sent, notifications_delivered = EXCLUDED.notifications_delivered, notifications_read = EXCLUDED.notifications_read, notifications_failed = EXCLUDED.notifications_failed, updated_at = now()
       RETURNING *`,
      [
        input.organizationId,
        input.summaryDate,
        input.channel,
        input.notificationsSent ?? 0,
        input.notificationsDelivered ?? 0,
        input.notificationsRead ?? 0,
        input.notificationsFailed ?? 0,
      ],
    );
    return mapAnalyticsCommunicationDailySummary(rows[0]);
  },

  async listCommunicationDailySummaries(orgId, fromDate, toDate) {
    const { rows } = await query(
      `SELECT * FROM analytics_communication_daily_summaries WHERE organization_id = $1 AND summary_date >= $2 AND summary_date <= $3 ORDER BY summary_date DESC`,
      [orgId, fromDate, toDate],
    );
    return rows.map(mapAnalyticsCommunicationDailySummary);
  },

  async upsertSlaDailySummary(input) {
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

  async listSlaDailySummaries(orgId, fromDate, toDate) {
    const { rows } = await query(
      `SELECT * FROM analytics_sla_daily_summaries WHERE organization_id = $1 AND summary_date >= $2 AND summary_date <= $3 ORDER BY summary_date DESC`,
      [orgId, fromDate, toDate],
    );
    return rows.map(mapAnalyticsSlaDailySummary);
  },
};
