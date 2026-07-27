import { query } from '../../../db/pool.js';
import type { TrendRecord, TrendMetric, TrendDirection } from '../types.js';

function computeDirection(current: number, previous: number | undefined): TrendDirection {
  if (previous === undefined || previous === 0) return 'stable';
  const pct = ((current - previous) / previous) * 100;
  if (pct > 2) return 'up';
  if (pct < -2) return 'down';
  return 'stable';
}

function buildTrendRow(organizationId: string, metric: TrendMetric, period: string, value: number, previousValue: number | undefined, context: Record<string, unknown> = {}, computedAt = new Date().toISOString()): TrendRecord {
  const changePercent = previousValue !== undefined && previousValue > 0 ? Number(((value - previousValue) / previousValue) * 100).toFixed(2) : undefined;
  return {
    id: '', organizationId, metric, period, value, previousValue,
    changePercent: changePercent ? parseFloat(changePercent) : undefined,
    direction: computeDirection(value, previousValue), context, computedAt,
  };
}

export const trendAnalysisService = {
  async getTrends(organizationId: string, metric: TrendMetric, period = 'month'): Promise<TrendRecord[]> {
    const interval = period === 'year' ? 'year' : period === 'week' ? 'week' : 'month';
    const trendRows = await query<{ period: string; value: string; prev_value: string | null }>(
      `WITH series AS (
         SELECT DATE_TRUNC($1, created_at) AS period, COUNT(*)::int as value
         FROM cases WHERE organization_id = $2 AND is_deleted = FALSE
         GROUP BY 1 ORDER BY 1 ASC
       ), lagged AS (
         SELECT period, value, LAG(value) OVER (ORDER BY period) as prev_value FROM series
       )
       SELECT period, value, prev_value FROM lagged`,
      [interval, organizationId],
    );
    return trendRows.rows.map((r) => {
      const value = parseFloat(r.value);
      const prev = r.prev_value !== null ? parseFloat(r.prev_value) : undefined;
      return buildTrendRow(organizationId, metric, r.period, value, prev);
    });
  },

  async getComplianceTrends(organizationId: string): Promise<{
    score: TrendRecord[];
    violations: TrendRecord[];
    training: TrendRecord[];
    audits: TrendRecord[];
  }> {
    const [scoreRows, violRows, trainRows, auditRows] = await Promise.all([
      query<{ period: string; value: string }>(`SELECT DATE_TRUNC('month', created_at) as period, COALESCE(AVG(risk_score),0)::numeric as value FROM cases WHERE organization_id = $1 AND is_deleted = FALSE GROUP BY 1 ORDER BY 1 ASC`, [organizationId]),
      query<{ period: string; value: string }>(`SELECT DATE_TRUNC('month', created_at) as period, COUNT(*)::int as value FROM findings WHERE organization_id = $1 GROUP BY 1 ORDER BY 1 ASC`, [organizationId]),
      query<{ period: string; value: string }>(`SELECT DATE_TRUNC('month', created_at) as period, COUNT(*)::int as value FROM training_records WHERE organization_id = $1 GROUP BY 1 ORDER BY 1 ASC`, [organizationId]),
      query<{ period: string; value: string }>(`SELECT DATE_TRUNC('month', created_at) as period, COUNT(*)::int as value FROM audits WHERE organization_id = $1 GROUP BY 1 ORDER BY 1 ASC`, [organizationId]),
    ]);
    const mapRows = (rows: { period: string; value: string }[], metric: TrendMetric): TrendRecord[] => {
      const out: TrendRecord[] = [];
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const value = parseFloat(r.value);
        const prev = i > 0 ? parseFloat(rows[i - 1].value) : undefined;
        out.push(buildTrendRow(organizationId, metric, r.period, value, prev));
      }
      return out;
    };
    return { score: mapRows(scoreRows.rows, 'compliance_score'), violations: mapRows(violRows.rows, 'violation_rate'), training: mapRows(trainRows.rows, 'training_completion'), audits: mapRows(auditRows.rows, 'audit_readiness') };
  },

  async getDepartmentTrends(organizationId: string): Promise<Array<{ departmentId: string; departmentName: string; score: number; trend: TrendDirection }>> {
    const { rows } = await query<{ id: string; name: string; avg_score: string | null }>(
      `SELECT d.id, d.name, COALESCE(AVG(c.risk_score),0)::numeric as avg_score FROM departments d LEFT JOIN cases c ON c.department_id = d.id AND c.is_deleted = FALSE WHERE d.organization_id = $1 GROUP BY d.id, d.name`,
      [organizationId],
    );
    return rows.map((r) => ({
      departmentId: r.id, departmentName: r.name, score: parseFloat(r.avg_score ?? '0'),
      trend: computeDirection(parseFloat(r.avg_score ?? '0'), undefined),
    }));
  },

  async getFactoryComparison(organizationId: string): Promise<Array<{ factoryId: string; factoryName: string; complianceScore: number; violationCount: number; capaCount: number }>> {
    const { rows } = await query<{ id: string; name: string; avg_score: string | null; findings: string | null; capas: string | null }>(
      `SELECT s.id, s.name, COALESCE(AVG(c.risk_score),0)::numeric as avg_score, COUNT(DISTINCT f.id) as findings, COUNT(DISTINCT capa.id) as capas
       FROM sites s LEFT JOIN cases c ON c.factory_id = s.id AND c.is_deleted = FALSE
       LEFT JOIN findings f ON f.linked_audit_id IN (SELECT id FROM audits WHERE organization_id = $1)
       LEFT JOIN capas capa ON capa.non_conformity_id IN (SELECT id FROM non_conformities WHERE finding_id = f.id)
       WHERE s.organization_id = $1 GROUP BY s.id, s.name`,
      [organizationId],
    );
    return rows.map((r) => ({
      factoryId: r.id, factoryName: r.name, complianceScore: 100 - parseFloat(r.avg_score ?? '0'),
      violationCount: parseInt(r.findings ?? '0', 10), capaCount: parseInt(r.capas ?? '0', 10),
    }));
  },
};
