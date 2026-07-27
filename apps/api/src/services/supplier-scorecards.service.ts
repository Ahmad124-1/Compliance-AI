import { randomUUID } from 'node:crypto';

import { audit } from '../core/audit.js';
import { NotFoundError } from '../core/errors.js';
import { query } from '../db/pool.js';
import type { SupplierScorecardRecord, SupplierBenchmarkResult, SupplierScorecardSummary } from '../modules/supplier-scorecards/types.js';

function mapRow<T>(row: Record<string, any>): T { return row as T; }

export const supplierScorecardService = {
  async generateScorecard(organizationId: string, supplierId: string, input: { assessmentPeriod?: string; overallEsgScore?: number; environmentalScore?: number; socialScore?: number; governanceScore?: number; complianceScore?: number; carbonScore?: number; riskScore?: number }, actorId?: string | null): Promise<SupplierScorecardRecord> {
    const record: SupplierScorecardRecord = {
      id: randomUUID(),
      organizationId,
      supplierId,
      overallEsgScore: input.overallEsgScore ?? 0,
      environmentalScore: input.environmentalScore ?? 0,
      socialScore: input.socialScore ?? 0,
      governanceScore: input.governanceScore ?? 0,
      complianceScore: input.complianceScore ?? 0,
      carbonScore: input.carbonScore ?? 0,
      riskScore: input.riskScore ?? 0,
      benchmarkComparison: {},
      trendAnalysis: [],
      historicalPerformance: [],
      assessmentPeriod: input.assessmentPeriod ?? null,
      scoringDate: new Date().toISOString(),
      nextReviewDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await query(`INSERT INTO supplier_scorecards (id, organization_id, supplier_id, overall_esg_score, environmental_score, social_score, governance_score, compliance_score, carbon_score, risk_score, benchmark_comparison, trend_analysis, historical_performance, assessment_period, scoring_date, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`, [record.id, record.organizationId, record.supplierId, record.overallEsgScore, record.environmentalScore, record.socialScore, record.governanceScore, record.complianceScore, record.carbonScore, record.riskScore, JSON.stringify(record.benchmarkComparison), JSON.stringify(record.trendAnalysis), JSON.stringify(record.historicalPerformance), record.assessmentPeriod, record.scoringDate, record.createdAt, record.updatedAt]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier_scorecard.create', entity: 'supplier_scorecard', entityId: record.id });
    return record;
  },

  async getScorecards(organizationId: string, supplierId?: string): Promise<SupplierScorecardRecord[]> {
    let sql = `SELECT * FROM supplier_scorecards WHERE organization_id = $1 AND is_deleted = FALSE`;
    const params: unknown[] = [organizationId];
    if (supplierId) { sql += ` AND supplier_id = $2`; params.push(supplierId); }
    sql += ` ORDER BY scoring_date DESC NULLS LAST, created_at DESC`;
    const { rows } = await query<Record<string, any>>(sql, params);
    return rows.map(mapRow<SupplierScorecardRecord>);
  },

  async getLatestScorecard(organizationId: string, supplierId: string): Promise<SupplierScorecardRecord | null> {
    const { rows } = await query<Record<string, any>>(`SELECT * FROM supplier_scorecards WHERE organization_id = $1 AND supplier_id = $2 AND is_deleted = FALSE ORDER BY scoring_date DESC LIMIT 1`, [organizationId, supplierId]);
    return rows[0] ? mapRow<SupplierScorecardRecord>(rows[0]) : null;
  },

  async getBenchmark(organizationId: string): Promise<SupplierScorecardRecord[]> {
    const { rows } = await query<Record<string, any>>(`SELECT supplier_id, overall_esg_score, environmental_score, social_score, governance_score, compliance_score, carbon_score, risk_score, scoring_date FROM supplier_scorecards WHERE organization_id = $1 AND is_deleted = FALSE ORDER BY overall_esg_score DESC`, [organizationId]);
    const total = rows.length;
    return rows.map((r, i) => ({ ...r, rank: i + 1, percentile: total > 0 ? Math.round(((total - i) / total) * 100) : 0 }) as any);
  },

  async deleteScorecard(id: string, organizationId: string, actorId?: string | null): Promise<void> {
    await query(`UPDATE supplier_scorecards SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND organization_id = $2`, [id, organizationId]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier_scorecard.delete', entity: 'supplier_scorecard', entityId: id });
  },
};