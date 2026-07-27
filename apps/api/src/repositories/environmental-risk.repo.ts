import { query } from '../db/pool.js';
import type { EnvironmentalRisk, LikelihoodLevel, SeverityLevel, RiskStatus, ReviewSchedule } from '../types/environment.js';

function mapEnvironmentalRisk(row: any): EnvironmentalRisk {
  return {
    id: row.id,
    organizationId: row.organization_id,
    facilityId: row.facility_id,
    siteId: row.site_id,
    aspect: row.aspect,
    impact: row.impact,
    likelihood: row.likelihood,
    severity: row.severity,
    riskScore: Number(row.risk_score),
    controls: row.controls,
    mitigationMeasures: row.mitigation_measures,
    monitoringPlan: row.monitoring_plan,
    responsibleOwnerId: row.responsible_owner_id,
    reviewSchedule: row.review_schedule,
    lastReviewDate: row.last_review_date,
    nextReviewDate: row.next_review_date,
    status: row.status,
    notes: row.notes,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface EnvironmentalRiskFilter {
  facilityId?: string;
  siteId?: string;
  status?: RiskStatus;
  minScore?: number;
  maxScore?: number;
}

export const environmentalRiskRepo = {
  async create(input: {
    organizationId: string;
    facilityId?: string | null;
    siteId?: string | null;
    aspect: string;
    impact: string;
    likelihood: LikelihoodLevel;
    severity: SeverityLevel;
    riskScore: number;
    controls?: string | null;
    mitigationMeasures?: string | null;
    monitoringPlan?: string | null;
    responsibleOwnerId?: string | null;
    reviewSchedule?: ReviewSchedule | null;
    lastReviewDate?: string | null;
    nextReviewDate?: string | null;
    status?: RiskStatus;
    notes?: string | null;
  }): Promise<EnvironmentalRisk> {
    const { rows } = await query<EnvironmentalRisk>(
      `INSERT INTO environmental_risks (organization_id, facility_id, site_id, aspect, impact, likelihood, severity, risk_score, controls, mitigation_measures, monitoring_plan, responsible_owner_id, review_schedule, last_review_date, next_review_date, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [
        input.organizationId,
        input.facilityId ?? null,
        input.siteId ?? null,
        input.aspect,
        input.impact,
        input.likelihood,
        input.severity,
        input.riskScore,
        input.controls ?? null,
        input.mitigationMeasures ?? null,
        input.monitoringPlan ?? null,
        input.responsibleOwnerId ?? null,
        input.reviewSchedule ?? null,
        input.lastReviewDate ?? null,
        input.nextReviewDate ?? null,
        input.status ?? 'active',
        input.notes ?? null,
      ],
    );
    return mapEnvironmentalRisk(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<EnvironmentalRisk | null> {
    const { rows } = await query<EnvironmentalRisk>(
      `SELECT * FROM environmental_risks WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapEnvironmentalRisk(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: EnvironmentalRiskFilter = {}): Promise<EnvironmentalRisk[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.facilityId) { where.push(`facility_id = $${i++}`); params.push(filter.facilityId); }
    if (filter.siteId) { where.push(`site_id = $${i++}`); params.push(filter.siteId); }
    if (filter.status) { where.push(`status = $${i++}`); params.push(filter.status); }
    if (filter.minScore !== undefined) { where.push(`risk_score >= $${i++}`); params.push(filter.minScore); }
    if (filter.maxScore !== undefined) { where.push(`risk_score <= $${i++}`); params.push(filter.maxScore); }
    const { rows } = await query<EnvironmentalRisk>(
      `SELECT * FROM environmental_risks WHERE ${where.join(' AND ')} ORDER BY risk_score DESC`,
      params,
    );
    return rows.map(mapEnvironmentalRisk);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<EnvironmentalRisk, 'aspect' | 'impact' | 'likelihood' | 'severity' | 'riskScore' | 'controls' | 'mitigationMeasures' | 'monitoringPlan' | 'responsibleOwnerId' | 'reviewSchedule' | 'lastReviewDate' | 'nextReviewDate' | 'status' | 'notes'>>): Promise<EnvironmentalRisk | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.aspect !== undefined) set('aspect', patch.aspect);
    if (patch.impact !== undefined) set('impact', patch.impact);
    if (patch.likelihood !== undefined) set('likelihood', patch.likelihood);
    if (patch.severity !== undefined) set('severity', patch.severity);
    if (patch.riskScore !== undefined) set('risk_score', patch.riskScore);
    if (patch.controls !== undefined) set('controls', patch.controls);
    if (patch.mitigationMeasures !== undefined) set('mitigation_measures', patch.mitigationMeasures);
    if (patch.monitoringPlan !== undefined) set('monitoring_plan', patch.monitoringPlan);
    if (patch.responsibleOwnerId !== undefined) set('responsible_owner_id', patch.responsibleOwnerId);
    if (patch.reviewSchedule !== undefined) set('review_schedule', patch.reviewSchedule);
    if (patch.lastReviewDate !== undefined) set('last_review_date', patch.lastReviewDate);
    if (patch.nextReviewDate !== undefined) set('next_review_date', patch.nextReviewDate);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.notes !== undefined) set('notes', patch.notes);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<EnvironmentalRisk>(
      `UPDATE environmental_risks SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapEnvironmentalRisk(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE environmental_risks SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
