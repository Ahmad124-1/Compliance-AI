import { query } from '../db/pool.js';

export const mapAnalyticsCaseDailySummary = (row) => ({
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

export const analyticsCaseDailySummaryRepo = {
  async upsert(input) {
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

  async findByDateRange(orgId, dateFrom, dateTo, siteId, departmentId) {
    const conditions = ['organization_id = $1', 'summary_date >= $2', 'summary_date <= $3'];
    const params = [orgId, dateFrom, dateTo];
    if (siteId) { conditions.push(`site_id = $${params.length + 1}`); params.push(siteId); }
    if (departmentId) { conditions.push(`department_id = $${params.length + 1}`); params.push(departmentId); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(`SELECT * FROM analytics_case_daily_summaries ${where} ORDER BY summary_date ASC`, params);
    return rows.map(mapAnalyticsCaseDailySummary);
  },
};
