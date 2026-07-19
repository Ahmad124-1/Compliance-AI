import { NotFoundError } from '../core/errors.js';
import { analyticsCaseDailySummaryRepo } from '../repositories/analytics-case-daily-summary.repo.js';
import { analyticsCommunicationDailySummaryRepo } from '../repositories/analytics-communication-daily-summary.repo.js';
import { analyticsSlaDailySummaryRepo } from '../repositories/analytics-sla-daily-summary.repo.js';
import { caseRepo } from '../repositories/case.repo.js';
import { organizationRepo } from '../repositories/organization.repo.js';
import { slaInstanceRepo } from '../repositories/sla-instance.repo.js';
import { qrScanEventRepo } from '../repositories/qr-scan-event.repo.js';
import { query } from '../db/pool.js';

export interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  siteId?: string;
  departmentId?: string;
  caseId?: string;
  qrCodeId?: string;
}

export const analyticsService = {
  async getCaseAnalytics(orgId, filters: AnalyticsFilters = {}) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    if (filters.dateFrom && filters.dateTo) {
      const summaries = await analyticsCaseDailySummaryRepo.findByDateRange(orgId, filters.dateFrom, filters.dateTo, filters.siteId, filters.departmentId);
      const totalCases = summaries.reduce((sum, s) => sum + s.totalCases, 0);
      const newCases = summaries.reduce((sum, s) => sum + s.newCases, 0);
      const closedCases = summaries.reduce((sum, s) => sum + s.closedCases, 0);
      const openCases = summaries.reduce((sum, s) => sum + s.openCases, 0);
      const escalatedCases = summaries.reduce((sum, s) => sum + s.escalatedCases, 0);
      return {
        totalCases, newCases, closedCases, openCases, escalatedCases,
        avgResponseTimeMinutes: summaries.length ? summaries.reduce((sum, s) => sum + (s.avgResponseTimeMinutes ?? 0), 0) / summaries.length : 0,
        avgResolutionTimeMinutes: summaries.length ? summaries.reduce((sum, s) => sum + (s.avgResolutionTimeMinutes ?? 0), 0) / summaries.length : 0,
        avgSlaComplianceRate: summaries.length ? summaries.reduce((sum, s) => sum + (s.avgSlaComplianceRate ?? 0), 0) / summaries.length : 0,
      };
    }
    const { rows } = await query(
      `SELECT status, COUNT(*) AS count FROM cases WHERE organization_id = $1 AND is_deleted = FALSE GROUP BY status`,
      [orgId],
    );
    return {
      byStatus: rows.reduce((acc, r) => { acc[r.status] = parseInt(r.count, 10); return acc; }, {}),
      total: rows.reduce((sum, r) => sum + parseInt(r.count, 10), 0),
    };
  },

  async getCommunicationAnalytics(orgId, filters: AnalyticsFilters = {}) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    if (filters.dateFrom && filters.dateTo) {
      return analyticsCommunicationDailySummaryRepo.findByDateRange(orgId, filters.dateFrom, filters.dateTo);
    }
    const { rows } = await query(
      `SELECT channel, COUNT(*) AS count FROM notification_deliveries WHERE organization_id = $1 GROUP BY channel`,
      [orgId],
    );
    return rows.reduce((acc, r) => { acc[r.channel] = parseInt(r.count, 10); return acc; }, {});
  },

  async getSlaAnalytics(orgId, filters: AnalyticsFilters = {}) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    if (filters.dateFrom && filters.dateTo) {
      return analyticsSlaDailySummaryRepo.findByDateRange(orgId, filters.dateFrom, filters.dateTo);
    }
    return slaInstanceRepo.getStats(orgId);
  },

  async getEscalationAnalytics(orgId) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const { rows } = await query(
      `SELECT rule_id, COUNT(*) AS count FROM escalation_history eh JOIN cases c ON c.id = eh.case_id WHERE c.organization_id = $1 GROUP BY rule_id`,
      [orgId],
    );
    return rows.reduce((acc, r) => { acc[r.rule_id] = parseInt(r.count, 10); return acc; }, {});
  },

  async getQrAnalytics(orgId, filters: AnalyticsFilters = {}) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const qrCodeId = filters.qrCodeId;
    return qrScanEventRepo.getOrgAnalytics(orgId, { qrCodeId, dateFrom: filters.dateFrom, dateTo: filters.dateTo });
  },

  async getKpis(orgId, filters: AnalyticsFilters = {}) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const caseAnalytics = await this.getCaseAnalytics(orgId, filters);
    const escAnalytics = await this.getEscalationAnalytics(orgId);
    const totalEscalations = Object.values(escAnalytics as Record<string, number>).reduce((sum, count) => sum + count, 0);
    return {
      totalCases: caseAnalytics.totalCases ?? caseAnalytics.total ?? 0,
      openCases: caseAnalytics.openCases ?? 0,
      closedCases: caseAnalytics.closedCases ?? 0,
      escalatedCases: caseAnalytics.escalatedCases ?? totalEscalations,
      avgResponseTimeMinutes: caseAnalytics.avgResponseTimeMinutes ?? 0,
      avgResolutionTimeMinutes: caseAnalytics.avgResolutionTimeMinutes ?? 0,
      avgSlaComplianceRate: caseAnalytics.avgSlaComplianceRate ?? 0,
    };
  },

  async getTrends(orgId, _metric, period) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const interval = period === 'month' ? 'month' : 'day';
    const { rows } = await query(
      `SELECT DATE_TRUNC($1, created_at) AS period, COUNT(*) AS count FROM cases WHERE organization_id = $2 AND is_deleted = FALSE GROUP BY 1 ORDER BY 1 ASC`,
      [interval, orgId],
    );
    return rows.map((r) => ({ period: r.period, count: parseInt(r.count, 10) }));
  },

  async getHeatmapData(orgId, _metric) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const { rows } = await query(
      `SELECT EXTRACT(DOW FROM created_at) AS day_of_week, EXTRACT(HOUR FROM created_at) AS hour, COUNT(*) AS count FROM cases WHERE organization_id = $1 AND is_deleted = FALSE GROUP BY 1, 2 ORDER BY 1, 2`,
      [orgId],
    );
    return rows.map((r) => ({ dayOfWeek: parseInt(r.day_of_week, 10), hour: parseInt(r.hour, 10), count: parseInt(r.count, 10) }));
  },

  async refreshDailySummaries(orgId?, date?) {
    const targetDate = date ? new Date(date) : new Date();
    const dateStr = targetDate.toISOString().slice(0, 10);
    const orgIds = orgId ? [orgId] : (await organizationRepo.list()).map((o) => o.id);
    const results: any[] = [];
    for (const org of orgIds) {
      const cases = await caseRepo.listByOrganization(org);
      const casesList = cases.cases ?? [];
      const totalCases = casesList.length;
      const newCases = casesList.filter((c) => new Date(c.createdAt).toISOString().slice(0, 10) === dateStr).length;
      const closedCases = casesList.filter((c) => c.status === 'closed' && c.updatedAt && new Date(c.updatedAt).toISOString().slice(0, 10) === dateStr).length;
      const openCases = casesList.filter((c) => c.status === 'open').length;
      const escalatedCases = casesList.filter((c) => c.status === 'escalated').length;
      const byStatus = casesList.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {});
      const byPriority = casesList.reduce((acc, c) => { acc[c.priority] = (acc[c.priority] || 0) + 1; return acc; }, {});
      const summary = await analyticsCaseDailySummaryRepo.upsert({
        organizationId: org,
        summaryDate: dateStr,
        totalCases,
        newCases,
        closedCases,
        openCases,
        escalatedCases,
        byStatus,
        byPriority,
        byCategory: {},
        bySource: {},
        byCountry: {},
        anonymousCases: casesList.filter((c) => c.reporterAnonymous).length,
        namedCases: casesList.filter((c) => !c.reporterAnonymous).length,
      });
      results.push(summary);
    }
    return results;
  },
};
